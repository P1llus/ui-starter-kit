/**
 * Dev flags, read once from the URL at page load. Document the project's scenarios in
 * docs/data/world.md and list them on /dev/mock.
 *
 *   ?freeze                 no clock and no tickers, for stable screenshots
 *   ?freeze=15:00           the same, with "now" pinned to 15:00 today (matches doc sketches)
 *   ?world=empty            a named scenario; `world` takes a comma list: ?world=empty,degraded
 *
 * Client-side navigation drops the query, but the flags keep the value they had at load.
 */
export interface WorldFlags {
  freeze: boolean;
  /** `HH:MM` from `?freeze=15:00`, or null. */
  freezeAt: string | null;
  /** Scenario names from `?world=`. Generators ask `hasScenario('empty')`. */
  scenarios: ReadonlySet<string>;
}

function readFlags(): WorldFlags {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const params = new URLSearchParams(search);
  const scenarios = new Set(
    (params.get('world') ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  );
  const freezeValue = params.get('freeze');
  const freezeAt = freezeValue && /^\d{1,2}:\d{2}$/.test(freezeValue) ? freezeValue : null;
  return { freeze: params.has('freeze'), freezeAt, scenarios };
}

export const worldFlags: Readonly<WorldFlags> = Object.freeze(readFlags());

/** True when the page loaded with `?world=<name>` (alone or in a comma list). */
export function hasScenario(name: string): boolean {
  return worldFlags.scenarios.has(name);
}
