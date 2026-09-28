import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  // One scroll position per page, not per history entry. Opening a flyout, a filter or a sort
  // changes only the search params, so the page keeps its scroll (ux/flyouts.md).
  getScrollRestorationKey: (location) => location.pathname,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
