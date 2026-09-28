import { registerFlyoutKind } from '@/components/flyout';

/**
 * Every flyout kind in the app, one line each. The kind registry doc (docs/ux/flyouts.md)
 * lists the same kinds with the page that owns each one.
 */
registerFlyoutKind('service', () => import('@/features/home/flyouts/ServiceFlyout'));
