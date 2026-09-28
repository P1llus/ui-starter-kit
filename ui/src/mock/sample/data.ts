import { MINUTE, at, hasScenario, rng } from '../core';
import type { Activity, Service } from './types';

const SERVICES: readonly [id: string, name: string, owner: string][] = [
  ['svc-checkout', 'Checkout', 'payments'],
  ['svc-search', 'Search', 'discovery'],
  ['svc-accounts', 'Accounts', 'identity'],
  ['svc-billing', 'Billing', 'payments'],
  ['svc-notify', 'Notifications', 'platform'],
  ['svc-media', 'Media upload', 'content'],
];

const ACTORS = ['a.lind', 'k.berg', 'deploy-bot', 'm.osei'];
const EVENTS = [
  'deployed a new version',
  'scaled to 6 replicas',
  'rotated its credentials',
  'passed a health check',
];

export function buildServices(): Service[] {
  if (hasScenario('empty')) return [];
  return SERVICES.map(([id, name, owner]) => {
    const r = rng('sample', 'service', id);
    return {
      id,
      name,
      owner,
      // The story needs Billing failing at load; the rest start healthy.
      status: id === 'svc-billing' ? 'failing' : 'healthy',
      latencyMs: Math.round(r.float(40, 180)),
      updatedAt: at(-r.int(1, 50) * MINUTE),
    };
  });
}

export function buildActivity(services: readonly Service[]): Activity[] {
  const r = rng('sample', 'activity');
  const history: Activity[] = [];
  for (let i = 0; i < 24 && services.length > 0; i++) {
    const service = r.pick(services);
    history.push({
      id: `act-${1000 + i}`,
      at: at(-(i * 7 + r.int(0, 6)) * MINUTE),
      serviceId: service.id,
      actor: r.pick(ACTORS),
      text: `${service.name} ${r.pick(EVENTS)}`,
    });
  }
  return history; // newest first
}
