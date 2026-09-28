import { EuiText } from '@elastic/eui';
import { Page, PageHeader, useActiveTab } from '@/components/page';
import { collectSections, type DevSection } from './sections';

const SECTIONS = collectSections(
  import.meta.glob<{ section?: DevSection }>('./components/*.tsx', { eager: true }),
);

/**
 * Gallery of shared components: one tab per file in features/dev/components/, each rendering a
 * component with realistic inline data, so reviewers can check it in light and dark before pages
 * adopt it.
 */
export function ComponentsPage() {
  const tabs = SECTIONS.map((s) => ({ id: s.id, label: s.label }));
  const active = useActiveTab(tabs);
  const Section = SECTIONS.find((s) => s.id === active)?.Component;
  return (
    <Page>
      <PageHeader title="Components" description="Shared components with realistic data." tabs={tabs} />
      {Section ? <Section /> : <EuiText color="subdued">No component sections yet.</EuiText>}
    </Page>
  );
}
