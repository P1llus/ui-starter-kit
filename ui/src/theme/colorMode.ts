import { create } from 'zustand';

export type ColorMode = 'light' | 'dark';
/** What the user picked. `system` follows the OS setting. */
export type ColorModePreference = ColorMode | 'system';

const STORAGE_KEY = 'prototype.colorMode';

export function parseColorMode(value: unknown): ColorMode | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function parsePreference(value: unknown): ColorModePreference | null {
  return value === 'system' ? 'system' : parseColorMode(value);
}

/** Reads `?theme=light|dark` from a search string. Screenshot scripts use it to force a mode. */
export function colorModeFromSearch(search: string): ColorMode | null {
  return parseColorMode(new URLSearchParams(search).get('theme'));
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');
const systemMode = (): ColorMode => (systemQuery().matches ? 'dark' : 'light');

function readStored(): ColorModePreference | null {
  try {
    return parsePreference(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStored(preference: ColorModePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage can be blocked; the mode still applies for this session.
  }
}

const resolve = (preference: ColorModePreference): ColorMode =>
  preference === 'system' ? systemMode() : preference;

interface ColorModeState {
  /** The mode in effect. */
  colorMode: ColorMode;
  preference: ColorModePreference;
  /** User choice: applied and remembered in localStorage. */
  setPreference: (preference: ColorModePreference) => void;
  toggleColorMode: () => void;
  /** URL override: applied for this page load only, never stored. */
  forceColorMode: (mode: ColorMode) => void;
}

const initialPreference = readStored() ?? 'system';

/** Start order: `?theme=` in the URL, then the saved choice, then the OS setting. */
export const useColorModeStore = create<ColorModeState>()((set, get) => ({
  colorMode: colorModeFromSearch(window.location.search) ?? resolve(initialPreference),
  preference: initialPreference,
  setPreference: (preference) => {
    writeStored(preference);
    set({ preference, colorMode: resolve(preference) });
  },
  toggleColorMode: () => get().setPreference(get().colorMode === 'dark' ? 'light' : 'dark'),
  forceColorMode: (mode) => set({ colorMode: mode }),
}));

// `system` follows the OS while the app is open.
systemQuery().addEventListener('change', () => {
  const { preference } = useColorModeStore.getState();
  if (preference === 'system') useColorModeStore.setState({ colorMode: systemMode() });
});

export const useColorMode = () => useColorModeStore((s) => s.colorMode);
