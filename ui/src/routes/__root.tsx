import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from '@/app/RootLayout';
import { NotFound } from '@/app/NotFound';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
