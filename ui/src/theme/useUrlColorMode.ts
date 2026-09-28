import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { colorModeFromSearch, useColorModeStore } from './colorMode';

/** Applies `?theme=light|dark` whenever the URL carries it, including client-side navigation. */
export function useUrlColorMode() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const forceColorMode = useColorModeStore((s) => s.forceColorMode);

  useEffect(() => {
    const mode = colorModeFromSearch(searchStr);
    if (mode) forceColorMode(mode);
  }, [searchStr, forceColorMode]);
}
