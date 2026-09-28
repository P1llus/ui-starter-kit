import { useCallback } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useSearchParam, useUpdateSearch } from '@/lib/url';
import { parseFlyoutTarget } from './registry';

const PUSHED = '__flyoutPushed';

function pushedMark(state: unknown): boolean {
  return Boolean(state && typeof state === 'object' && (state as Record<string, unknown>)[PUSHED]);
}

/**
 * The open flyout from the URL, and helpers to open and close one.
 *
 * Opening pushes a history entry, so browser Back closes the flyout. Closing pops that entry
 * when the flyout pushed it, and otherwise (a pasted link, a reload) replaces the URL, so the
 * history never holds two copies of the same page.
 */
export function useFlyout() {
  const router = useRouter();
  const target = parseFlyoutTarget(useSearchParam('flyout'));
  const tab = useSearchParam('ftab');
  const update = useUpdateSearch();

  const open = useCallback(
    (kind: string, id: string, ftab?: string) => {
      const loc = router.history.location;
      const params = new URLSearchParams(loc.search);
      params.set('flyout', `${kind}:${id}`);
      if (ftab) params.set('ftab', ftab);
      else params.delete('ftab');
      const href = `${loc.pathname}?${params.toString()}${loc.hash}`;
      // The first open pushes; switching from one flyout to another replaces and keeps the mark.
      if (new URLSearchParams(loc.search).has('flyout'))
        router.history.replace(href, { [PUSHED]: Boolean(pushedMark(loc.state)) });
      else router.history.push(href, { [PUSHED]: true });
    },
    [router],
  );

  const close = useCallback(() => {
    if (pushedMark(router.history.location.state)) router.history.back();
    else
      update((p) => {
        p.delete('flyout');
        p.delete('ftab');
      });
  }, [router, update]);

  const setTab = useCallback(
    (ftab: string | undefined) =>
      update((p) => {
        if (ftab) p.set('ftab', ftab);
        else p.delete('ftab');
      }),
    [update],
  );

  return { kind: target?.kind, id: target?.id, tab, open, close, setTab };
}
