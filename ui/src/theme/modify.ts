import type { EuiThemeModifications } from '@elastic/eui';

/**
 * Overrides on top of Borealis, passed to EuiProvider's `modify` prop. Keep it empty unless
 * docs/design/tokens.md records a reason: a second token system fights the base theme.
 */
export const themeModify: EuiThemeModifications = {};
