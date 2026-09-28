import { createFileRoute } from '@tanstack/react-router';
import { ComponentsPage } from '@/features/dev/ComponentsPage';
import { searchParams, text } from '@/lib/router';

export const Route = createFileRoute('/dev/components')({
  // Tabs come from the collected sections, so any tab id passes.
  validateSearch: searchParams({ tab: text }),
  component: ComponentsPage,
});
