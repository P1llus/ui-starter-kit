import type { MouseEvent, ReactNode } from 'react';
import { EuiLink } from '@elastic/eui';
import { useNavigate } from '@tanstack/react-router';

/**
 * A link to another page of the app. It renders a real href (middle-click, copy link) and
 * navigates client-side on a plain click. A bare `<EuiLink href>` reloads the whole app,
 * which also resets the mock world: never use one for in-app links.
 */
export function AppLink({ to, children }: { to: string; children: ReactNode }) {
  const navigate = useNavigate();
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate({ href: to });
  };
  return (
    <EuiLink href={to} onClick={onClick}>
      {children}
    </EuiLink>
  );
}
