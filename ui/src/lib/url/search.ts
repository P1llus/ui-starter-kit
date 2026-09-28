import { useCallback, useMemo } from 'react';
import { useRouter, useRouterState } from '@tanstack/react-router';

/**
 * URL state helpers. Tabs, filters, the open flyout and view modes live in search params, so
 * reload, back and a pasted link restore the same view, and a screenshot script can reach any
 * state with a URL instead of a chain of clicks.
 */

/** Current search params. Re-renders on every location change. */
export function useSearchParams(): URLSearchParams {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  return useMemo(() => new URLSearchParams(searchStr), [searchStr]);
}

/** One search param, or undefined. */
export function useSearchParam(key: string): string | undefined {
  return useSearchParams().get(key) ?? undefined;
}

export interface CommitOptions {
  /** Default true: filters and tabs replace the history entry instead of filling Back. */
  replace?: boolean;
}

/**
 * Returns `update(fn)`, which applies `fn` to the latest search params and commits the URL.
 * It reads the router's history location, which is current even before React re-renders, so
 * several updates in a row build on each other. Search-only changes never scroll the page.
 */
export function useUpdateSearch() {
  const router = useRouter();
  return useCallback(
    (update: (params: URLSearchParams) => void, { replace = true }: CommitOptions = {}) => {
      const loc = router.history.location;
      const params = new URLSearchParams(loc.search);
      const before = params.toString();
      update(params);
      const qs = params.toString();
      if (qs === before) return;
      const href = `${loc.pathname}${qs ? `?${qs}` : ''}${loc.hash}`;
      if (replace) router.history.replace(href, keepState(loc.state));
      else router.history.push(href);
    },
    [router],
  );
}

/** App keys in a history entry's state (such as the flyout's "I pushed this" mark), without the router's own. */
function keepState(state: unknown): Record<string, unknown> {
  if (!state || typeof state !== 'object') return {};
  return Object.fromEntries(
    Object.entries(state as Record<string, unknown>).filter(([k]) => !k.startsWith('__TSR') && k !== 'key'),
  );
}

/** A `[value, setValue]` pair bound to one search param. `undefined` removes it. */
export function useSearchState(key: string): [string | undefined, (value: string | undefined) => void] {
  const value = useSearchParam(key);
  const update = useUpdateSearch();
  const set = useCallback(
    (next: string | undefined) =>
      update((p) => {
        if (next === undefined || next === '') p.delete(key);
        else p.set(key, next);
      }),
    [key, update],
  );
  return [value, set];
}
