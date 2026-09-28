import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/features/home/pages/HomePage';
import { tabSearch } from '@/lib/router';

export const Route = createFileRoute('/')({
  validateSearch: tabSearch(['services', 'activity']),
  component: HomePage,
});
