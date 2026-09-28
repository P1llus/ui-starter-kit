import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldText,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { useState } from 'react';
import { Page, PageHeader } from '@/components/page';

/**
 * Smoke page: one of each library piece the prototype leans on, so a dependency upgrade or a
 * theme change that breaks something shows in one screenshot (light and dark). Add a panel
 * when the project adds a library (charts, node graphs, code editors).
 */
export function SmokePage() {
  const [on, setOn] = useState(true);
  return (
    <Page>
      <PageHeader title="Smoke" description="Key library pieces in the current theme." />
      <EuiFlexGrid columns={2}>
        <EuiFlexItem>
          <EuiPanel hasBorder>
            <EuiTitle size="xs">
              <h3>Buttons and badges</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiFlexGroup gutterSize="s" wrap responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButton fill>Primary</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton>Secondary</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty>Tertiary</EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
              {(['success', 'warning', 'danger', 'primary', 'hollow', 'default'] as const).map((c) => (
                <EuiFlexItem grow={false} key={c}>
                  <EuiBadge color={c}>{c}</EuiBadge>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel hasBorder>
            <EuiTitle size="xs">
              <h3>Form</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiFormRow label="Name" helpText="Plain words, sentence case.">
              <EuiFieldText defaultValue="Checkout" />
            </EuiFormRow>
            <EuiFormRow label="Owner">
              <EuiSelect options={[{ text: 'payments' }, { text: 'platform' }]} />
            </EuiFormRow>
            <EuiFormRow>
              <EuiSwitch label="Enabled" checked={on} onChange={(e) => setOn(e.target.checked)} />
            </EuiFormRow>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCallOut title="Callout" color="warning" iconType="warning">
            <p>What is wrong, why, and at most two fixes.</p>
          </EuiCallOut>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel hasBorder>
            <EuiText size="s">
              <p>
                Body text in Inter, machine values in mono: <code>svc-billing</code>.
              </p>
            </EuiText>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGrid>
    </Page>
  );
}
