import { useState } from 'react';
import { EuiButton, EuiDescriptionList, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { FlyoutFrame, type FlyoutContentProps } from '@/components/flyout';
import { toastResult } from '@/components/toast';
import { sampleActions, useActivity, useService } from '@/mock';
import { ActivityFeed } from '../components/ActivityFeed';
import { StatusBadge } from '@/components/status';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
];

/** Flyout for the `service` kind. Default export: the registry loads it lazily. */
export default function ServiceFlyout({ id, tab }: FlyoutContentProps) {
  const service = useService(id);
  const activity = useActivity(id);
  const [busy, setBusy] = useState(false);

  if (!service) {
    return (
      <FlyoutFrame title="Service not found">
        <EuiText color="subdued">No service with the id “{id}” exists in this world.</EuiText>
      </FlyoutFrame>
    );
  }

  const restart = async () => {
    setBusy(true);
    toastResult(await sampleActions.restart(service.id));
    setBusy(false);
  };

  return (
    <FlyoutFrame
      title={service.name}
      subtitle={`Owned by ${service.owner}`}
      badges={<StatusBadge status={service.status} />}
      tabs={TABS}
      footer={
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={restart} isLoading={busy} data-test-subj="restartService">
              Restart
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
    >
      {tab === 'activity' ? (
        <ActivityFeed activity={activity} />
      ) : (
        <EuiDescriptionList
          type="column"
          columnWidths={[1, 3]}
          listItems={[
            { title: 'p95 latency', description: `${service.latencyMs} ms` },
            { title: 'Owner', description: service.owner },
            { title: 'Id', description: <code>{service.id}</code> },
          ]}
        />
      )}
    </FlyoutFrame>
  );
}
