/**
 * Search param validation that never drops params it doesn't know.
 *
 * TanStack Router runs `validateSearch` on load, rewrites the URL from the result, and builds
 * links from it. A validator that returns only its own keys strips `flyout`, `ftab`, `form`,
 * filters and dev flags. Build every route's `validateSearch` with these helpers.
 *
 *   validateSearch: tabSearch(['services', 'activity'])
 *   validateSearch: searchParams({ view: oneOf(['all', 'failing']), q: text })
 */

/** Search params as the router parsed them. Numbers and booleans arrive parsed. */
export type SearchRecord = Record<string, unknown>;

/** Returns the valid value, or undefined to drop the param. */
export type SearchParser<T> = (value: unknown) => T | undefined;

type Parsed<S extends Record<string, SearchParser<unknown>>> = {
  [K in keyof S]?: S[K] extends SearchParser<infer T> ? T : never;
};

/**
 * A `validateSearch` for the keys in `schema`. Each known key is parsed and dropped when
 * invalid; every other param passes through unchanged.
 */
export function searchParams<S extends Record<string, SearchParser<unknown>>>(schema: S) {
  return (search: SearchRecord): Parsed<S> & SearchRecord => {
    const out: SearchRecord = { ...search };
    for (const key of Object.keys(schema)) {
      const value = schema[key](search[key]);
      if (value === undefined) delete out[key];
      else out[key] = value;
    }
    return out as Parsed<S> & SearchRecord;
  };
}

/** A string from a fixed list. */
export function oneOf<T extends string>(values: readonly T[]): SearchParser<T> {
  return (value) =>
    typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Any non-empty text. Numbers the router parsed come back as text. */
export const text: SearchParser<string> = (value) => {
  if (typeof value === 'string') return value === '' ? undefined : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

/**
 * `validateSearch` for a page with tabs: `tab` must be one of `ids`, everything else passes
 * through. A page treats a missing `tab` as its first tab.
 */
export function tabSearch<T extends string>(ids: readonly T[]) {
  return searchParams({ tab: oneOf(ids) });
}
