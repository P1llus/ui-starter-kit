import { delay, emit, fail, markUserAction, now, ok, sequence, type ActionResult } from '../core';
import { useSampleStore } from './store';
import type { Service } from './types';

export const nextActivityId = sequence('act-', 2000);

export function addActivity(serviceId: string, actor: string, text: string): void {
  useSampleStore.setState((s) => ({
    activity: [{ id: nextActivityId(), at: now(), serviceId, actor, text }, ...s.activity],
  }));
}

function patchService(id: string, patch: Partial<Service>): void {
  useSampleStore.setState((s) => ({
    services: s.services.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
  }));
}

/**
 * Writes go through actions like these. They mutate the store, may simulate slow work with
 * real timers, and resolve to `{ ok, message }` that the UI shows as a toast.
 */
export const sampleActions = {
  async restart(id: string): Promise<ActionResult> {
    const service = useSampleStore.getState().services.find((x) => x.id === id);
    if (!service) return fail('That service no longer exists.');
    await delay(1200);
    patchService(id, { status: 'healthy', latencyMs: 60 });
    addActivity(id, 'you', `${service.name} restarted`);
    emit('sample.service.status', { serviceId: id, status: 'healthy' });
    markUserAction();
    return ok(`Restarted ${service.name}. It reports healthy again.`);
  },

  setStatus(id: string, status: Service['status']): void {
    patchService(id, { status });
    emit('sample.service.status', { serviceId: id, status });
  },
};
