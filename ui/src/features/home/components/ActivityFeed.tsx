import { EuiButtonEmpty, EuiCallOut, EuiSpacer, EuiText, useEuiTheme } from '@elastic/eui';
import { formatRelative } from '@/lib/format';
import { useHeldList, useNow, type Activity } from '@/mock';

/**
 * A feed the user reads: new rows wait behind a "N new · Show" pill in its own row above the
 * list, so nothing moves under the reader. Pause holds the list; the pill keeps counting.
 */
export function ActivityFeed({ activity }: { activity: Activity[] }) {
  const { euiTheme } = useEuiTheme();
  const now = useNow(30_000);
  const { rows, pending, showPending, freshIds } = useHeldList(activity, { getId: (a) => a.id });

  return (
    <>
      {pending > 0 && (
        <>
          <EuiCallOut size="s" color="primary" title={null}>
            <EuiButtonEmpty size="xs" onClick={showPending} data-test-subj="showNew">
              {pending} new · Show
            </EuiButtonEmpty>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}
      <ul css={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {rows.map((a) => (
          <li
            key={a.id}
            css={{
              display: 'flex',
              gap: euiTheme.size.m,
              padding: `${euiTheme.size.s} 0`,
              borderBottom: euiTheme.border.thin,
              background: freshIds.has(a.id) ? euiTheme.colors.backgroundBaseSubdued : undefined,
              transition: 'background 2s',
            }}
          >
            <EuiText size="s" css={{ flex: 1 }}>
              {a.text}
            </EuiText>
            <EuiText size="s" color="subdued">
              {a.actor} · {formatRelative(a.at, now)}
            </EuiText>
          </li>
        ))}
      </ul>
    </>
  );
}
