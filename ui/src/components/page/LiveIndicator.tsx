import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { formatRelative } from '@/lib/format';
import { useLive, useNow } from '@/mock';

/**
 * "Updated 12 s ago" with the one app-wide pause toggle. Pass the time the page last took
 * fresh data (`useLiveSnapshot(...).updatedAt`). Pause freezes what views show, not the world.
 */
export function LiveIndicator({ updatedAt }: { updatedAt: number }) {
  const { paused, setPaused } = useLive();
  const now = useNow();
  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiText size="xs" color="subdued">
          {paused ? 'Paused' : `Updated ${formatRelative(updatedAt, now)}`}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType={paused ? 'play' : 'pause'}
          aria-label={paused ? 'Resume live updates' : 'Pause live updates'}
          onClick={() => setPaused(!paused)}
          size="xs"
          color="text"
          data-test-subj="liveToggle"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
