import type { ReactNode } from 'react';
import { useEuiTheme } from '@elastic/eui';

/** Page padding and width. Every routed page renders inside one. */
export function Page({ children }: { children: ReactNode }) {
  const { euiTheme } = useEuiTheme();
  return (
    <div css={{ padding: euiTheme.size.l, minWidth: 0, maxWidth: 1600 }} data-test-subj="page">
      {children}
    </div>
  );
}
