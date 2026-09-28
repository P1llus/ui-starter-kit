import { EuiEmptyPrompt } from '@elastic/eui';

export function NotFound() {
  return (
    <EuiEmptyPrompt
      iconType="search"
      title={<h2>Page not found</h2>}
      body={<p>Check the address, or pick a page from the side nav.</p>}
    />
  );
}
