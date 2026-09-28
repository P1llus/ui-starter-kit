/**
 * The mock world's only public entry: `import { useServices, sampleActions } from '@/mock'`.
 * UI code never imports from a folder below this one (eslint enforces it).
 *
 * The world is built in the browser at module load from a fixed seed and lives in zustand
 * stores, one per domain. A page reload or dev server restart resets everything.
 */

// ------------------------------------------------------------------ Core
export type { EpochMs, ActionResult } from './core/types';
export {
  now,
  at,
  parseOffset,
  duration,
  todayAt,
  minuteOf,
  LOAD_TIME,
  SECOND,
  MINUTE,
  HOUR,
  DAY,
} from './core/clock';
export { worldFlags, hasScenario, type WorldFlags } from './core/flags';
export { startLive, setPaused, liveInfo, advance } from './core/live';
export {
  useLive,
  useNow,
  useLiveSnapshot,
  useHeldList,
  type LiveStatus,
  type LiveSnapshot,
  type LiveSnapshotOptions,
  type HeldList,
  type HeldListOptions,
} from './core/hooks';
export { buildReport } from './core/build';

// ------------------------------------------------------------------ Domains
// Each domain folder has an index.ts that lists its public hooks, actions and types.

// Sample: a stand-in domain that shows the patterns. Delete it once real domains exist.
export * from './sample';
