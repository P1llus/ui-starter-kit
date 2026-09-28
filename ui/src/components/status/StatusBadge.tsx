import { EuiBadge } from '@elastic/eui';

/**
 * Colour means state, and one word means one colour on every page. Add a word here (with its
 * tone) instead of choosing a badge colour in a page. Rules: docs/components/status.md.
 */
export type Tone = 'good' | 'active' | 'attention' | 'broken' | 'idle';

const TONE_COLOR: Record<Tone, string> = {
  good: 'success',
  active: 'primary',
  attention: 'warning',
  broken: 'danger',
  idle: 'default',
};

/** Every state word the app shows, and its tone. Outcome words are fixed for runs, jobs and tasks. */
export const STATUS_TONES = {
  healthy: 'good',
  degraded: 'attention',
  failing: 'broken',
  succeeded: 'good',
  failed: 'broken',
  running: 'active',
  queued: 'idle',
  waiting: 'idle',
  cancelled: 'idle',
  skipped: 'idle',
} as const satisfies Record<string, Tone>;

export type StatusWord = keyof typeof STATUS_TONES;

const label = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function StatusBadge({ status }: { status: StatusWord }) {
  return <EuiBadge color={TONE_COLOR[STATUS_TONES[status]]}>{label(status)}</EuiBadge>;
}
