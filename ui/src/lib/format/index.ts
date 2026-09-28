/**
 * The one formatting module: every time, number, size and duration on screen goes through it,
 * so the same value reads the same on every page. Rules: docs/design/conventions.md.
 * Pass `now` from `useNow()` (mock time), never `Date.now()`, so `?freeze` works.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** What an empty cell shows. Key-value rows say "Not set", never-run things "Never". */
export const EMPTY = '—';

const LOCALE = 'en-GB';
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
const clock = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
const clockSeconds = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
const full = new Intl.NumberFormat(LOCALE);
const compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });

function sameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** "25 Sep", or "25 Sep 2025" when not this year. */
export function formatDate(t: number, now: number): string {
  return new Date(t).getFullYear() === new Date(now).getFullYear()
    ? dayMonth.format(t)
    : dayMonthYear.format(t);
}

/** "just now", "12 s ago", "3 min ago", "2 h ago", "yesterday", "4 days ago", then the date. */
export function formatRelative(t: number | null | undefined, now: number): string {
  if (t == null) return EMPTY;
  const d = now - t;
  if (d < 0) return `in ${formatDuration(-d)}`;
  if (d < 5 * SECOND) return 'just now';
  if (d < MINUTE) return `${Math.floor(d / SECOND)} s ago`;
  if (d < HOUR) return `${Math.floor(d / MINUTE)} min ago`;
  if (d < DAY && sameDay(t, now)) return `${Math.floor(d / HOUR)} h ago`;
  if (d < 2 * DAY && sameDay(t + DAY, now)) return 'yesterday';
  if (d < 7 * DAY) return `${Math.max(1, Math.round(d / DAY))} days ago`;
  return formatDate(t, now);
}

/** Event timestamps: "14:46:02" today, "25 Sep 14:46" before. */
export function formatTimestamp(t: number | null | undefined, now: number): string {
  if (t == null) return EMPTY;
  return sameDay(t, now) ? clockSeconds.format(t) : `${formatDate(t, now)} ${clock.format(t)}`;
}

/** A clock time inside a sentence: "at 13:10", "yesterday at 09:40". */
export function formatAt(t: number, now: number): string {
  if (sameDay(t, now)) return `at ${clock.format(t)}`;
  if (sameDay(t + DAY, now)) return `yesterday at ${clock.format(t)}`;
  return `${formatDate(t, now)} at ${clock.format(t)}`;
}

/** Durations and ages: "45 s", "4 min", "2 h 10 min", "3 days". */
export function formatDuration(ms: number): string {
  if (ms < MINUTE) return `${Math.max(0, Math.round(ms / SECOND))} s`;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} min`;
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms % HOUR) / MINUTE);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const days = Math.round(ms / DAY);
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Full numbers with separators: "1,234". Use for anything compared, counted in a sentence or typed. */
export function formatNumber(n: number | null | undefined): string {
  return n == null ? EMPTY : full.format(n);
}

/** "12.3k" for approximate totals shown alone, full below 10,000. Never for compared values. */
export function formatCompact(n: number | null | undefined): string {
  if (n == null) return EMPTY;
  return Math.abs(n) < 10000 ? full.format(n) : compact.format(n).toLowerCase();
}

/** A ratio (0..1) as "41%"; values under 1% keep one decimal. */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio == null) return EMPTY;
  const p = ratio * 100;
  return `${p !== 0 && Math.abs(p) < 1 ? p.toFixed(1) : Math.round(p)}%`;
}

/** "512 B", "1.2 KB", "3.4 GB" (base 1024). */
export function formatBytes(n: number | null | undefined): string {
  if (n == null) return EMPTY;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let v = n;
  let i = 0;
  while (Math.abs(v) >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 ? v : v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
