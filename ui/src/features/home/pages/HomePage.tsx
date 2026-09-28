import { EuiText } from '@elastic/eui';
import { LiveIndicator, Page, PageHeader, useActiveTab } from '@/components/page';
import { useActivity, useLiveSnapshot, useServices } from '@/mock';
import { ActivityFeed } from '../components/ActivityFeed';
import { ServicesTable } from '../components/ServicesTable';

const TABS = [
  { id: 'services', label: 'Services' },
  { id: 'activity', label: 'Activity' },
];

/**
 * Sample page. It shows the patterns every page follows: one question answered by the first
 * screen, tabs in the URL, a flyout opened by URL, live values held by the app-wide pause,
 * and a feed with a "N new" pill. Replace it once the real pages exist.
 */
export function HomePage() {
  const tab = useActiveTab(TABS);
  const services = useServices();
  const { value: shown, updatedAt } = useLiveSnapshot(services, { everyMs: 5000 });
  const activity = useActivity();
  const failing = shown.filter((s) => s.status !== 'healthy').length;

  return (
    <Page>
      <PageHeader
        title="Home"
        description="Sample page: services and what changed recently."
        actions={[<LiveIndicator key="live" updatedAt={updatedAt} />]}
        tabs={TABS}
      />
      {tab === 'services' ? (
        <>
          <EuiText size="s" css={{ marginBottom: 12 }}>
            {failing === 0
              ? 'All services are healthy.'
              : `${failing} of ${shown.length} services need attention.`}
          </EuiText>
          <ServicesTable services={shown} />
        </>
      ) : (
        <ActivityFeed activity={activity} />
      )}
    </Page>
  );
}
