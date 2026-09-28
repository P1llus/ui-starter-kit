import { useShallow } from 'zustand/react/shallow';
import { useSampleStore } from './store';
import type { Activity, Service, ServiceStatus } from './types';

/** All services in world order. Pages sort. */
export function useServices(filter?: { status?: ServiceStatus }): Service[] {
  return useSampleStore(
    useShallow((s) => (filter?.status ? s.services.filter((x) => x.status === filter.status) : s.services)),
  );
}

export function useService(id: string | undefined): Service | undefined {
  return useSampleStore((s) => s.services.find((x) => x.id === id));
}

/** Newest first. */
export function useActivity(serviceId?: string): Activity[] {
  return useSampleStore(
    useShallow((s) => (serviceId ? s.activity.filter((a) => a.serviceId === serviceId) : s.activity)),
  );
}

/** Non-hook getter for code outside React (flyout titles, other domains). */
export function getService(id: string): Service | undefined {
  return useSampleStore.getState().services.find((x) => x.id === id);
}
