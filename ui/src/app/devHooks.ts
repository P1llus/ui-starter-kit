import { advance, liveInfo, now, setPaused } from '@/mock';
import { useColorModeStore, type ColorMode } from '@/theme';
import { router } from './router';

/**
 * Hooks for screenshot and walkthrough scripts (scratch/shoot.py, scratch/browse.py). They let
 * a script move around without a full page load, which would reset the mock world:
 *
 *   window.__app.navigate('/dev/mock')      client-side navigation, the world keeps its state
 *   window.__app.setColorMode('dark')       flip the theme on the current state
 *   window.__mock.advance('90s')            jump mock time so story beats fire now
 *
 * The prototype has no secrets and no backend, so the hooks ship in every build.
 */
export interface AppDevHooks {
  navigate: (href: string) => Promise<void>;
  setColorMode: (mode: ColorMode) => void;
}

export interface MockDevHooks {
  advance: (by: string | number) => void;
  now: () => number;
  setPaused: (paused: boolean) => void;
  liveInfo: typeof liveInfo;
}

declare global {
  interface Window {
    __app?: AppDevHooks;
    __mock?: MockDevHooks;
  }
}

export function installDevHooks(): void {
  window.__app = {
    navigate: (href) => router.navigate({ href }),
    setColorMode: (mode) => useColorModeStore.getState().forceColorMode(mode),
  };
  window.__mock = { advance, now, setPaused, liveInfo };
}
