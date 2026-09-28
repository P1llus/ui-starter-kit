import { createFileRoute } from '@tanstack/react-router';
import { DevIndexPage } from '@/features/dev/DevIndexPage';

export const Route = createFileRoute('/dev/')({
  component: DevIndexPage,
});
