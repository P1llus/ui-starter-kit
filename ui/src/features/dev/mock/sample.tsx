import {
  EuiBasicTable,
  EuiButton,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';
import { StatusBadge } from '@/components/status';
import { advance, useSampleStore, type Service } from '@/mock';
import type { DevSection } from '../sections';

/** The sample domain on /dev/mock. Each real domain adds a file like this one. */
function SampleSection() {
  const { services, activity } = useSampleStore();
  return (
    <>
      <EuiDescriptionList
        type="column"
        columnWidths={[1, 4]}
        listItems={[
          { title: 'Services', description: String(services.length) },
          { title: 'Activity rows', description: String(activity.length) },
        ]}
      />
      <EuiSpacer />
      <EuiFlexGroup gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          {/* Story buttons let builders and scripts reach a beat without waiting for it. */}
          <EuiButton size="s" onClick={() => advance('65s')} data-test-subj="beat-search-degrades">
            Jump to the Search incident (+60 s)
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiBasicTable
        items={services}
        columns={[
          { field: 'id', name: 'Id', render: (id: string) => <code>{id}</code> },
          { field: 'name', name: 'Name' },
          { field: 'status', name: 'Status', render: (s: Service['status']) => <StatusBadge status={s} /> },
          { field: 'latencyMs', name: 'p95 latency', render: (ms: number) => `${ms} ms` },
        ]}
      />
    </>
  );
}

export const section: DevSection = { id: 'sample', label: 'Sample domain', Component: SampleSection };
