import type { ComponentType } from 'react';

/**
 * A section of a dev gallery page. Each file in features/dev/mock/ or features/dev/components/
 * exports one as `section`; the page collects them with import.meta.glob. Parallel agents each
 * add their own file, so nobody edits a shared page.
 */
export interface DevSection {
  /** Tab id in the URL: /dev/mock?tab=<id>. */
  id: string;
  label: string;
  /** Lower comes first. Default 100. */
  order?: number;
  Component: ComponentType;
}

export function collectSections(modules: Record<string, { section?: DevSection }>): DevSection[] {
  return Object.values(modules)
    .map((m) => m.section)
    .filter((s): s is DevSection => Boolean(s))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.label.localeCompare(b.label));
}
