import type { ReactNode } from 'react';
import { EuiPageHeader, EuiSpacer } from '@elastic/eui';
import { useSearchState } from '@/lib/url';

export interface PageTab {
  id: string;
  label: string;
}

export interface PageHeaderProps {
  title: string;
  /** One line stating what the page shows. Not a question, not marketing. */
  description?: string;
  /** One primary action at most; secondary actions next to it. */
  actions?: ReactNode[];
  /** Tabs live in `?tab=`; a missing param means the first tab. */
  tabs?: PageTab[];
}

/** The active tab id from the URL, falling back to the first tab. */
export function useActiveTab(tabs: PageTab[]): string {
  const [tab] = useSearchState('tab');
  return tabs.some((t) => t.id === tab) ? tab! : tabs[0]?.id;
}

export function PageHeader({ title, description, actions, tabs }: PageHeaderProps) {
  const [, setTab] = useSearchState('tab');
  const active = useActiveTab(tabs ?? []);
  return (
    <>
      <EuiPageHeader
        pageTitle={title}
        description={description}
        rightSideItems={actions}
        tabs={tabs?.map((t, i) => ({
          label: t.label,
          isSelected: t.id === active,
          // The first tab is the default, so it keeps the URL clean.
          onClick: () => setTab(i === 0 ? undefined : t.id),
          'data-test-subj': `tab-${t.id}`,
        }))}
        bottomBorder={tabs ? true : undefined}
      />
      <EuiSpacer size="l" />
    </>
  );
}
