import { FlyoutHost } from '@/components/flyout';
import { ToastList } from '@/components/toast';
import { useUrlColorMode } from '@/theme';
import { AppShell } from './shell/AppShell';

/** Root route: the shell, the URL-driven flyout host and the toast list. */
export function RootLayout() {
  useUrlColorMode();
  return (
    <>
      <AppShell />
      <FlyoutHost />
      <ToastList />
    </>
  );
}
