import { Suspense } from 'react';
import { EuiFlyout, EuiFlyoutBody, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { getFlyoutKind } from './registry';
import { useFlyout } from './useFlyout';

/**
 * Renders the flyout named in the URL. Mounted once in the root layout. Flyouts overlay the
 * page and never push it; the page behind keeps its filters, scroll and selection.
 */
export function FlyoutHost() {
  const { kind, id, tab, close } = useFlyout();
  if (!kind || !id) return null;
  const Content = getFlyoutKind(kind);

  return (
    <EuiFlyout
      key={`${kind}:${id}`}
      onClose={close}
      size="m"
      ownFocus={false}
      aria-label={`${kind} details`}
      data-test-subj={`flyout-${kind}`}
    >
      {Content ? (
        <Suspense
          fallback={
            <EuiFlyoutBody>
              <EuiLoadingSpinner size="l" />
            </EuiFlyoutBody>
          }
        >
          <Content id={id} tab={tab} />
        </Suspense>
      ) : (
        <EuiFlyoutBody>
          <EuiText color="subdued">Nothing to show for “{kind}”.</EuiText>
        </EuiFlyoutBody>
      )}
    </EuiFlyout>
  );
}
