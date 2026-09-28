import type { ActionResult } from './types';

/**
 * Helpers for actions. Simulated work (a connection test, a sync) uses real timers, not the
 * mock clock, so what the user started still finishes under `?freeze` or in a hidden tab.
 */

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ok<T = undefined>(message: string, data?: T): ActionResult<T> {
  return data === undefined ? { ok: true, message } : { ok: true, message, data };
}

export function fail<T = undefined>(message: string): ActionResult<T> {
  return { ok: false, message };
}
