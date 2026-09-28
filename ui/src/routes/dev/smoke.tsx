import { createFileRoute } from '@tanstack/react-router';
import { SmokePage } from '@/features/dev/SmokePage';

export const Route = createFileRoute('/dev/smoke')({
  component: SmokePage,
});
