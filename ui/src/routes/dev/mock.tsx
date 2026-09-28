import { createFileRoute } from '@tanstack/react-router';
import { searchParams, text } from '@/lib/router';
import { MockPage } from '@/features/dev/MockPage';

export const Route = createFileRoute('/dev/mock')({
  // Tabs come from the collected sections, so any tab id passes.
  validateSearch: searchParams({ tab: text }),
  component: MockPage,
});
