import { EuiBasicTable, EuiCode, EuiDescriptionList, EuiSpacer, EuiTitle } from '@elastic/eui';
import { Page, PageHeader, useActiveTab } from '@/components/page';
import { LOAD_TIME, buildReport, liveInfo, useNow, worldFlags } from '@/mock';
import { collectSections, type DevSection } from './sections';

const SECTIONS = collectSections(import.meta.glob<{ section?: DevSection }>('./mock/*.tsx', { eager: true }));

const offset = (t: number) => {
  const s = Math.round((t - LOAD_TIME) / 1000);
  return `${s >= 0 ? '+' : ''}${s}s`;
};

const code = (name: string) => <EuiCode transparentBackground>{name}</EuiCode>;

/** Build time, flags, tickers and story beats: the live loop at a glance. */
function WorldTab() {
  useNow(1000);
  const { totalMs, entries } = buildReport();
  const live = liveInfo();
  return (
    <>
      <EuiDescriptionList
        type="column"
        columnWidths={[1, 4]}
        listItems={[
          {
            title: 'Built in',
            description: `${totalMs.toFixed(1)} ms (${entries.map((e) => `${e.name} ${e.ms.toFixed(1)} ms`).join(', ')})`,
          },
          {
            title: 'Frozen',
            description: worldFlags.freeze
              ? `yes${worldFlags.freezeAt ? ` at ${worldFlags.freezeAt}` : ''}`
              : 'no',
          },
          { title: 'Scenarios', description: [...worldFlags.scenarios].join(', ') || 'none' },
        ]}
      />
      <EuiSpacer />
      <EuiTitle size="xs">
        <h3>Tickers</h3>
      </EuiTitle>
      <EuiBasicTable
        items={live.tickers}
        columns={[
          { field: 'name', name: 'Name', render: code },
          { field: 'everyMs', name: 'Every', render: (ms: number) => `${ms / 1000} s` },
        ]}
      />
      <EuiSpacer />
      <EuiTitle size="xs">
        <h3>Story beats</h3>
      </EuiTitle>
      <EuiBasicTable
        items={live.beats}
        columns={[
          { field: 'name', name: 'Name', render: code },
          { field: 'at', name: 'At', render: offset },
          { field: 'done', name: 'Done', render: (done: boolean) => (done ? 'yes' : 'no') },
        ]}
      />
    </>
  );
}

/**
 * The mock world at a glance: a World tab for the live loop, then one tab per domain, collected
 * from features/dev/mock/*.tsx. A builder checks here that the world looks right before
 * building pages on it.
 */
export function MockPage() {
  const tabs = [{ id: 'world', label: 'World' }, ...SECTIONS.map((s) => ({ id: s.id, label: s.label }))];
  const active = useActiveTab(tabs);
  const Section = SECTIONS.find((s) => s.id === active)?.Component ?? WorldTab;
  return (
    <Page>
      <PageHeader
        title="Mock world"
        description="Build time, live loop, flags and each domain's data."
        tabs={tabs}
      />
      <Section />
    </Page>
  );
}
