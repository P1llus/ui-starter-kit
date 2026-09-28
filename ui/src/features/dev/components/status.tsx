import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { STATUS_TONES, StatusBadge, type StatusWord } from '@/components/status';
import type { DevSection } from '../sections';

/** Every state word with its colour, so reviewers can check the whole set at once. */
function StatusSection() {
  return (
    <>
      <EuiTitle size="xs">
        <h3>StatusBadge</h3>
      </EuiTitle>
      <EuiText size="s" color="subdued">
        One word per state, one colour per word.
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s" wrap responsive={false}>
        {(Object.keys(STATUS_TONES) as StatusWord[]).map((word) => (
          <EuiFlexItem grow={false} key={word}>
            <StatusBadge status={word} />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </>
  );
}

export const section: DevSection = { id: 'status', label: 'Status', order: 10, Component: StatusSection };
