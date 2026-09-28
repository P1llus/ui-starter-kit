import type { ReactNode } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { useFlyout } from './useFlyout';

export interface FlyoutFrameProps {
  title: string;
  /** One line under the title: what this object is. */
  subtitle?: ReactNode;
  /** At most two badges, status first. */
  badges?: ReactNode;
  /** Tabs live in `?ftab=`; the first tab is the default. Overview first. */
  tabs?: { id: string; label: string }[];
  /** Primary action last on the right; secondary before it. */
  footer?: ReactNode;
  children: ReactNode;
}

/** The one flyout anatomy: header, optional tabs, body, footer. */
export function FlyoutFrame({ title, subtitle, badges, tabs, footer, children }: FlyoutFrameProps) {
  const { tab, setTab } = useFlyout();
  const active = tabs?.some((t) => t.id === tab) ? tab : tabs?.[0]?.id;
  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size="m">
              <h2>{title}</h2>
            </EuiTitle>
          </EuiFlexItem>
          {badges && <EuiFlexItem grow={false}>{badges}</EuiFlexItem>}
        </EuiFlexGroup>
        {subtitle && (
          <EuiText size="s" color="subdued">
            {subtitle}
          </EuiText>
        )}
        {tabs && (
          <>
            <EuiSpacer size="s" />
            <EuiTabs bottomBorder={false} css={{ marginBottom: -1 }}>
              {tabs.map((t, i) => (
                <EuiTab
                  key={t.id}
                  isSelected={t.id === active}
                  onClick={() => setTab(i === 0 ? undefined : t.id)}
                  data-test-subj={`ftab-${t.id}`}
                >
                  {t.label}
                </EuiTab>
              ))}
            </EuiTabs>
          </>
        )}
      </EuiFlyoutHeader>
      <EuiFlyoutBody>{children}</EuiFlyoutBody>
      {footer && <EuiFlyoutFooter>{footer}</EuiFlyoutFooter>}
    </>
  );
}
