import { createRoot } from 'react-dom/client';
import './theme/fonts';
import './theme/app.css';
import { App } from './app/App';
import { startLive } from './mock';
import { installDevHooks } from './app/devHooks';

// Importing ./mock builds the mock world; this starts its clock and tickers.
startLive();
installDevHooks();

// StrictMode is off on purpose: EUI does not support it (double effects break
// focus traps and portals).
createRoot(document.getElementById('root')!).render(<App />);
