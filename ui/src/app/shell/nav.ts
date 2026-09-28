import type { EuiIconType } from '@/theme';

/**
 * Side nav entries. Placeholder: docs/ux/navigation.md decides the real structure, and the
 * foundation build replaces this list (and probably the shell around it).
 */
export interface NavItem {
  label: string;
  to: string;
  icon: EuiIconType;
}

export const NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'Dev pages', to: '/dev', icon: 'wrench' },
];
