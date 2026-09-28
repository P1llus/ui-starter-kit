import { SECOND, at, noise, registerTicker, rng, scheduleAt } from '../core';
import { addActivity, sampleActions } from './actions';
import { useSampleStore } from './store';

// Latency jitters every 5 s. Values change in place; the UI must not shift layout.
registerTicker('sample.latency', 5 * SECOND, (t) => {
  useSampleStore.setState((s) => ({
    services: s.services.map((x) => {
      const base = x.status === 'healthy' ? 90 : x.status === 'degraded' ? 420 : 1600;
      return {
        ...x,
        latencyMs: Math.round(base * (0.8 + 0.4 * noise('latency', x.id, Math.floor(t / 5000)))),
      };
    }),
  }));
});

// A new activity row every 20 s, so feeds show the "N new · Show" pattern.
let tick = 0;
registerTicker('sample.activity', 20 * SECOND, () => {
  const { services } = useSampleStore.getState();
  if (services.length === 0) return;
  const r = rng('sample', 'live-activity', tick++);
  const service = r.pick(services);
  addActivity(service.id, 'deploy-bot', `${service.name} passed a health check`);
});

// Story beat: 60 s after load Search degrades, so live pages have something to show.
scheduleAt('sample.search-degrades', at('+60s'), () => {
  sampleActions.setStatus('svc-search', 'degraded');
  addActivity('svc-search', 'monitor', 'Search latency above 400 ms for 5 minutes');
});
