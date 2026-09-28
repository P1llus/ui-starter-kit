import { EuiBasicTable, EuiLink, type EuiBasicTableColumn } from '@elastic/eui';
import { useFlyout } from '@/components/flyout';
import type { Service } from '@/mock';
import { StatusBadge } from '@/components/status';

/** A row identifies a thing and shows its state. Detail lives one level down, in the flyout. */
export function ServicesTable({ services }: { services: Service[] }) {
  const { open, kind, id } = useFlyout();

  const columns: EuiBasicTableColumn<Service>[] = [
    {
      field: 'name',
      name: 'Service',
      render: (name: string, s: Service) => (
        <EuiLink onClick={() => open('service', s.id)} data-test-subj={`open-${s.id}`}>
          {name}
        </EuiLink>
      ),
    },
    {
      field: 'status',
      name: 'Status',
      width: '120px',
      render: (status: Service['status']) => <StatusBadge status={status} />,
    },
    { field: 'owner', name: 'Owner', width: '160px' },
    {
      field: 'latencyMs',
      name: 'p95 latency',
      width: '120px',
      align: 'right',
      render: (ms: number) => <span css={{ fontVariantNumeric: 'tabular-nums' }}>{ms} ms</span>,
    },
  ];

  return (
    <EuiBasicTable
      items={services}
      columns={columns}
      rowProps={(s) => ({ isSelected: kind === 'service' && id === s.id })}
      noItemsMessage="No services yet. Add one to see its status here."
      tableCaption="Services"
    />
  );
}
