/**
 * Startup timing. Each domain wraps its world generation in `timed(name, fn)`; `startLive()`
 * logs the total once in dev, and /dev/mock shows it. Budget: about 300 ms for everything.
 */

export interface BuildEntry {
  name: string;
  ms: number;
}

const entries: BuildEntry[] = [];

/** Runs `build`, records how long it took under `name`, and returns its result. */
export function timed<T>(name: string, build: () => T): T {
  const start = performance.now();
  const result = build();
  entries.push({ name, ms: performance.now() - start });
  return result;
}

export function buildReport(): { totalMs: number; entries: readonly BuildEntry[] } {
  return { totalMs: entries.reduce((sum, e) => sum + e.ms, 0), entries };
}

let logged = false;

/** Logs the build time once, in dev only. */
export function logBuildReport(): void {
  if (logged || !import.meta.env.DEV) return;
  logged = true;
  const { totalMs, entries: list } = buildReport();
  const parts = list.map((e) => `${e.name} ${e.ms.toFixed(1)} ms`).join(', ');
  console.info(`[mock] world built in ${totalMs.toFixed(1)} ms (${parts})`);
}
