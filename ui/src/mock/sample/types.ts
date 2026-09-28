import type { EpochMs } from '../core';

/**
 * The sample domain shows every mock pattern in a few lines: seeded data, a store, hooks,
 * an action with simulated work, a ticker and a story beat. Replace it with the project's
 * own domains during the foundation build, then delete it.
 */

export type ServiceStatus = 'healthy' | 'degraded' | 'failing';

export interface Service {
  id: string;
  name: string;
  owner: string;
  status: ServiceStatus;
  /** p95 latency in ms; jitters live. */
  latencyMs: number;
  updatedAt: EpochMs;
}

export interface Activity {
  id: string;
  at: EpochMs;
  serviceId: string;
  actor: string;
  text: string;
}
