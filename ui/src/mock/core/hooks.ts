import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SECOND, now } from './clock';
import { setPaused, subscribeTick, useLiveStore } from './live';

/** React side of the live loop. Pages use these; they never read the live store directly. */

export interface LiveStatus {
  paused: boolean;
  setPaused: (paused: boolean) => void;
  /** Mock time the views last took fresh data. Stops while paused. */
  lastUpdated: number;
}

/** The one app-wide pause, for LiveIndicator. Re-renders each loop pass (about once a second). */
export function useLive(): LiveStatus {
  return useLiveStore(useShallow((s) => ({ paused: s.paused, lastUpdated: s.lastUpdated, setPaused })));
}

/** Re-renders once per `stepMs` of mock time and returns the step number. */
function useClockStep(stepMs: number): number {
  const getSnapshot = useCallback(() => Math.floor(now() / stepMs), [stepMs]);
  return useSyncExternalStore(subscribeTick, getSnapshot);
}

/**
 * Mock "now" at render time, re-rendering at least once per `stepMs`. Use 1 s for countdowns
 * and "Updated 4 s ago", 30 s for relative times ("3 min ago"). Because it reads the clock on
 * every render, a timestamp an action just wrote is never in the future. Stands still under
 * `?freeze` and while the tab is hidden.
 */
export function useNow(stepMs: number = SECOND): number {
  useClockStep(stepMs);
  return now();
}

export interface LiveSnapshotOptions {
  /** The page's read cadence from its doc, e.g. 5 s for a status page, 30 s for a dashboard. Default 5 s. */
  everyMs?: number;
  /** Changing it (a filter, a Source) refreshes at once: the user asked for new data. */
  resetKey?: unknown;
}

export interface LiveSnapshot<T> {
  value: T;
  /** Pass to LiveIndicator as `updatedAt`. */
  updatedAt: number;
}

interface HeldSnapshot<T> extends LiveSnapshot<T> {
  bucket: number;
  epoch: number;
  resetKey: unknown;
  paused: boolean;
}

/**
 * Holds a live value still between refreshes. It takes the latest value once per `everyMs`,
 * never while paused, and at once on resume, on a user action and when `resetKey` changes.
 *
 *   const services = useServices();
 *   const { value: shown, updatedAt } = useLiveSnapshot(services, { everyMs: 5000 });
 */
export function useLiveSnapshot<T>(value: T, options: LiveSnapshotOptions = {}): LiveSnapshot<T> {
  const everyMs = options.everyMs ?? 5 * SECOND;
  const paused = useLiveStore((s) => s.paused);
  const epoch = useLiveStore((s) => s.userEpoch);
  const bucket = useClockStep(everyMs);
  const held = useRef<HeldSnapshot<T> | null>(null);

  const prev = held.current;
  const fresh = (): HeldSnapshot<T> => ({
    value,
    updatedAt: now(),
    bucket,
    epoch,
    resetKey: options.resetKey,
    paused,
  });
  let next: HeldSnapshot<T>;
  if (!prev || !Object.is(prev.resetKey, options.resetKey) || prev.epoch !== epoch) next = fresh();
  else if (paused) next = prev.paused ? prev : { ...prev, paused: true };
  else if (prev.paused || prev.bucket !== bucket) next = fresh();
  else next = prev;
  held.current = next;
  return next;
}

export interface HeldListOptions<T> {
  getId: (item: T) => string;
  /** Changing it (filters, sort) shows every current row and clears the pill. */
  resetKey?: unknown;
  /**
   * `always` (default): new rows wait behind a "3 new · Show" pill, as on any feed or
   * log the user reads. `whilePaused`: new rows show at once, and wait behind the pill only while paused.
   */
  hold?: 'always' | 'whilePaused';
  /** How long shown-in rows stay in `freshIds` for the fade. Default 2 s. */
  freshMs?: number;
}

export interface HeldList<T> {
  /** What the table shows. Frozen while paused, except after the user's own actions. */
  rows: T[];
  /** New rows waiting behind the pill. Keeps counting while paused. */
  pending: number;
  pendingRows: T[];
  /** The pill's Show: inserts the waiting rows and marks them fresh. */
  showPending: () => void;
  /** Rows just shown in, for the 2-second subdued background. */
  freshIds: ReadonlySet<string>;
}

interface HeldListState<T> {
  shown: Set<string>;
  resetKey: unknown;
  frozen: T[] | null;
  frozenEpoch: number;
  frozenShowCount: number;
}

const NO_IDS: ReadonlySet<string> = new Set();

/**
 * Keeps a list the user reads still while it grows. Pass the items already filtered and
 * sorted for the view (newest first); the pill counts only rows that match those filters.
 *
 *   const { rows, pending, showPending, freshIds } = useHeldList(activity, { getId: (e) => e.id, resetKey: filterKey });
 */
export function useHeldList<T>(items: readonly T[], options: HeldListOptions<T>): HeldList<T> {
  const { getId, resetKey, hold = 'always', freshMs = 2 * SECOND } = options;
  const paused = useLiveStore((s) => s.paused);
  const epoch = useLiveStore((s) => s.userEpoch);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(NO_IDS);
  const [showCount, setShowCount] = useState(0);
  const state = useRef<HeldListState<T> | null>(null);
  const latest = useRef({ items, getId });
  latest.current = { items, getId };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  let s = state.current;
  if (!s || !Object.is(s.resetKey, resetKey)) {
    s = {
      shown: new Set(items.map(getId)),
      resetKey,
      frozen: null,
      frozenEpoch: epoch,
      frozenShowCount: showCount,
    };
    state.current = s;
  }
  if (hold === 'whilePaused' && !paused) for (const item of items) s.shown.add(getId(item));

  const shown = s.shown;
  const visible = items.filter((item) => shown.has(getId(item)));
  const pendingRows = items.filter((item) => !shown.has(getId(item)));
  let rows = visible;
  if (paused) {
    if (s.frozen === null || s.frozenEpoch !== epoch || s.frozenShowCount !== showCount) {
      s.frozen = visible;
      s.frozenEpoch = epoch;
      s.frozenShowCount = showCount;
    }
    rows = s.frozen;
  } else {
    s.frozen = null;
  }

  const showPending = useCallback(() => {
    const current = state.current;
    if (!current) return;
    const { items: all, getId: idOf } = latest.current;
    const added = all.map(idOf).filter((id) => !current.shown.has(id));
    if (added.length === 0) return;
    added.forEach((id) => current.shown.add(id));
    setShowCount((c) => c + 1);
    setFreshIds(new Set(added));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFreshIds(NO_IDS), freshMs);
  }, [freshMs]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { rows, pending: pendingRows.length, pendingRows, showPending, freshIds };
}
