import { EuiText } from '@elastic/eui';
import { AppLink } from '@/components/link';
import { Page, PageHeader } from '@/components/page';

const PAGES = [
  {
    to: '/dev/smoke',
    label: 'Smoke',
    text: 'Renders the key library pieces in the current theme. If an upgrade breaks one, it shows here.',
  },
  { to: '/dev/mock', label: 'Mock world', text: 'Build time, tickers, story beats, flags and store counts.' },
  {
    to: '/dev/components',
    label: 'Components',
    text: 'Gallery of shared components, one section each, with realistic data.',
  },
];

/** Index of dev-only pages. Screenshot sweeps include them. */
export function DevIndexPage() {
  return (
    <Page>
      <PageHeader title="Dev pages" description="Tools for building and reviewing the prototype." />
      {PAGES.map((p) => (
        <EuiText key={p.to} size="s" css={{ marginBottom: 12 }}>
          <AppLink to={p.to}>{p.label}</AppLink>
          <p>{p.text}</p>
        </EuiText>
      ))}
    </Page>
  );
}
