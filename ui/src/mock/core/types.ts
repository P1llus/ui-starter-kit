/** Epoch milliseconds in mock time (see clock.ts). */
export type EpochMs = number;

/**
 * What every mock action returns. The UI shows `message` in a toast or inline; a failed
 * action says what went wrong in words a user understands.
 */
export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}
