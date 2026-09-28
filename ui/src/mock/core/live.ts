import { create } from 'zustand';
import { LOAD_TIME, clockRunning, duration, installVisibilityClock, now, skipTime } from './clock';
import { worldFlags } from './flags';
import { logBuildReport } from './build';

/**
 * The live loop and the one app-wide pause.
 *
 * - The world moves: domains register tickers (`registerTicker`) and one-shot story beats
 *   (`scheduleAt`). A single interval runs them while the clock runs (tab visible, no `?freeze`).
 * - Pause freezes what the views show, never the world. Tickers keep running while paused;
 *   views read through `useLiveSnapshot` / `useHeldList` (core/hooks.ts), which hold still.
 * - Actions call `markUserAction()` after they write, so a paused view still shows the
 *   result of what the user just did. Writes made from inside the loop (tickers, story beats,
 *   background jobs) are not the user's, so the call does nothing there.
 */

/** How often the loop checks its tickers. Ticker cadences are multiples of it. */
export const BASE_TICK_MS = 1000;

interface LiveState {
  paused: boolean;
  /** Mock time the views last took fresh data. Frozen while paused. */
  lastUpdated: number;
  /** Bumped by every user action, so held views refresh even while paused. */
  userEpoch: number;
}

export const useLiveStore = create<LiveState>()(() => ({
  paused: false,
  lastUpdated: LOAD_TIME,
  userEpoch: 0,
}));

/** Pauses or resumes live updates everywhere. Resume applies the current state in one step. */
export function setPaused(paused: boolean): void {
  useLiveStore.setState((s) =>
    s.paused === paused ? s : { paused, lastUpdated: paused ? s.lastUpdated : now() },
  );
}

/** Above 0 while the loop runs tickers and beats: writes then are the world's, not the user's. */
let backgroundDepth = 0;

/**
 * Call after an action writes a store, so paused views show the user's own result. Does
 * nothing when a ticker or story beat made the write, so Pause holds background changes.
 */
export function markUserAction(): void {
  if (backgroundDepth > 0) return;
  markUserResult();
}

/**
 * Like `markUserAction`, also from inside the loop: for a ticker that records the outcome of
 * something the user did, such as the effect of a fix they applied a minute ago.
 */
export function markUserResult(): void {
  useLiveStore.setState((s) => ({ userEpoch: s.userEpoch + 1 }));
}

interface Ticker {
  name: string;
  everyMs: number;
  fn: (t: number) => void;
  lastRun: number;
}

interface Beat {
  name: string;
  at: number;
  fn: () => void;
  done: boolean;
}

const tickers = new Map<string, Ticker>();
const beats = new Map<string, Beat>();
const listeners = new Set<() => void>();

/**
 * Runs `fn(now)` every `everyMs` of mock time while the clock runs. Names are unique;
 * registering a name again replaces the ticker. Returns an unregister function.
 */
export function registerTicker(name: string, everyMs: number, fn: (t: number) => void): () => void {
  tickers.set(name, { name, everyMs, fn, lastRun: now() });
  return () => tickers.delete(name);
}

/** Runs `fn` once when mock time reaches `at` (use `at('+90s')` from clock.ts). */
export function scheduleAt(name: string, atTime: number, fn: () => void): () => void {
  beats.set(name, { name, at: atTime, fn, done: false });
  return () => beats.delete(name);
}

/** Called after every loop pass; `useNow` uses it to re-render on its own step. */
export function subscribeTick(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function safely(name: string, fn: () => void): void {
  backgroundDepth++;
  try {
    fn();
  } catch (error) {
    console.error(`[mock] ticker "${name}" failed`, error);
  } finally {
    backgroundDepth--;
  }
}

function loop(): void {
  if (!clockRunning()) return;
  runPass();
}

/** One pass over tickers and beats at the current mock time. */
function runPass(): void {
  const t = now();
  for (const ticker of tickers.values()) {
    const since = t - ticker.lastRun;
    if (since < ticker.everyMs) continue;
    ticker.lastRun = t - (since % ticker.everyMs);
    safely(ticker.name, () => ticker.fn(t));
  }
  for (const beat of beats.values()) {
    if (beat.done || t < beat.at) continue;
    beat.done = true;
    safely(beat.name, beat.fn);
  }
  if (!useLiveStore.getState().paused) useLiveStore.setState({ lastUpdated: t });
  listeners.forEach((listener) => listener());
}

/**
 * Jumps mock time forward and runs one loop pass, so story beats that are due fire at once
 * and each ticker runs once (no catch-up burst). Works under `?freeze` too. Scripts call it
 * through the dev hook: `window.__mock.advance('90s')`.
 */
export function advance(by: string | number): void {
  skipTime(typeof by === 'number' ? by : duration(by));
  runPass();
}

let started = false;

/** Starts the loop. Called once from main.tsx; later calls do nothing. */
export function startLive(): void {
  if (started) return;
  started = true;
  installVisibilityClock();
  logBuildReport();
  if (worldFlags.freeze) return;
  setInterval(loop, BASE_TICK_MS);
}

/** What the loop runs, for /dev/mock. */
export function liveInfo() {
  return {
    started,
    frozen: worldFlags.freeze,
    tickers: [...tickers.values()].map(({ name, everyMs, lastRun }) => ({ name, everyMs, lastRun })),
    beats: [...beats.values()].map(({ name, at, done }) => ({ name, at, done })),
  };
}
