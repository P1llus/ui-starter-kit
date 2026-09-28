import { worldFlags } from './flags';

/**
 * The mock clock. Load time is "now" when the world is built, and story times are offsets
 * from it (`at('-47m')`). The clock runs only while the tab is visible: after the tab comes
 * back it carries on from where it stopped, with no catch-up. `?freeze` stops it at load
 * time. Generators, actions and components use `now()` or `useNow()`, never `Date.now()`.
 */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const WALL_START = Date.now();

function pinnedLoadTime(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(WALL_START);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Epoch ms of page load in mock time. Every story offset is relative to it. */
export const LOAD_TIME: number = pinnedLoadTime(worldFlags.freezeAt) ?? WALL_START;

let hiddenTotal = 0;
let hiddenSince: number | null = null;
/** Time skipped with `skipTime` (dev hook), so scripts need not wait for story beats. */
let skipped = 0;

/** Mock "now" in epoch ms. */
export function now(): number {
  if (worldFlags.freeze) return LOAD_TIME + skipped;
  const wall = hiddenSince ?? Date.now();
  return LOAD_TIME + skipped + (wall - WALL_START - hiddenTotal);
}

/** Moves mock time forward by `ms`. Use `advance()` from live.ts, which also runs the loop. */
export function skipTime(ms: number): void {
  skipped += Math.max(0, ms);
}

/** True while mock time moves: not frozen and the tab is visible. */
export function clockRunning(): boolean {
  return !worldFlags.freeze && hiddenSince === null;
}

let visibilityInstalled = false;

/** Stops the clock while the tab is hidden. Called once by `startLive()`. */
export function installVisibilityClock(): void {
  if (visibilityInstalled || typeof document === 'undefined') return;
  visibilityInstalled = true;
  const sync = () => {
    if (document.hidden && hiddenSince === null) hiddenSince = Date.now();
    else if (!document.hidden && hiddenSince !== null) {
      hiddenTotal += Date.now() - hiddenSince;
      hiddenSince = null;
    }
  };
  document.addEventListener('visibilitychange', sync);
  sync();
}

const OFFSET_RE = /^([+-])?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;

/**
 * Parses a story offset as used in the docs: `-47m`, `+90s`, `-6h20m`, `-5d`.
 * Throws on anything else, so a typo fails at load instead of placing an event wrongly.
 */
export function parseOffset(offset: string): number {
  const match = OFFSET_RE.exec(offset.replace(/\s+/g, ''));
  if (!match || offset.replace(/[\s+-]/g, '') === '') throw new Error(`Bad story offset "${offset}"`);
  const [, sign, d, h, m, s] = match;
  const ms = Number(d ?? 0) * DAY + Number(h ?? 0) * HOUR + Number(m ?? 0) * MINUTE + Number(s ?? 0) * SECOND;
  return sign === '-' ? -ms : ms;
}

/** Absolute time of a story offset: `at('-47m')`, or `at(-5 * MINUTE)`. */
export function at(offset: string | number): number {
  return LOAD_TIME + (typeof offset === 'number' ? offset : parseOffset(offset));
}

/** A duration in ms from the same notation without a sign: `duration('6h20m')`. */
export function duration(text: string): number {
  return Math.abs(parseOffset(text));
}

/** Local wall time on the load date, `dayOffset` days away: `todayAt(3)` is today 03:00. */
export function todayAt(hour: number, minute = 0, dayOffset = 0): number {
  const d = new Date(LOAD_TIME);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

/** Start of the minute that holds `t`. Generate time series in whole buckets. */
export function minuteOf(t: number): number {
  return Math.floor(t / MINUTE) * MINUTE;
}
