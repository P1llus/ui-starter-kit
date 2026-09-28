# The mock world

The prototype has no backend. It runs on one world generated in the browser at load: believable objects, a story that unfolds over the first minutes, and tickers that keep things moving. A reload resets it to the same start. Pages get designed for real behaviour (arrivals, progress, failures, empty states) instead of for a static screenshot, and every page shows the same story from its own angle.

- `world.md` (written in step 2 and the spec phase): the cast, the demo stories, the story beats, what moves, the scenarios. It is the source of truth for data facts.
- `model.md` (spec phase): every object's fields and links.
- This file: how the world is designed and how to use and extend the code in `ui/src/mock/`.

## Designing the world

- **Cast sheet.** Objects with real-sounding names (from the user and `docs/research/`), counts, states, owners. Include the ugly cases: a failing one, an empty one, one with a very long name, one with huge numbers, one half-configured.
- **Demo stories.** Three to six, one per persona, step by step, each starting on a real page. They become the story beats of the world and the script for the story reviewers.
- **Timeline.** Story times are offsets from load: something broke at `-47m`, a new item arrives at `+90s`. History before load, beats after it.
- **What moves.** Each live thing and its cadence, and what never changes by itself (configuration).
- **Scenarios.** Named variants for states that are hard to reach otherwise: `?world=empty` (first run), `?world=degraded`.
- Numbers live in `world.md` only; page docs say "about" or link there. Every "Open in X" link must land on data that exists. The "Data needed" bullets of the intake notes are the starting list.

## Using the mock API

```
ui/src/mock/
  index.ts      the only public entry: import { useServices, sampleActions } from '@/mock'
  core/         seeded random, clock, flags, ids, live loop and pause, event bus
  <domain>/     types.ts, data.ts, store.ts, hooks.ts, actions.ts, tickers.ts, index.ts
```

The kit ships a `sample` domain that shows every pattern in a few lines. Copy its shape for each real domain, then delete it.

**Determinism.** Generators never call `Math.random` or `Date.now` (lint blocks both). They take a stream keyed by what they make: `rng('billing', 'invoices', customerId)`, so adding an object never reshuffles the others. `noise(key, bucket)` gives one deterministic number for a pure function, such as a metric at a given minute. Change `WORLD_SEED` in `core/random.ts` for a new project.

**Clock.** `now()` is mock time; `at('-47m')` places a story time; `useNow(stepMs)` re-renders on a step (1 s for countdowns, 30 s for "3 min ago"). `?freeze` stops the clock at load; `?freeze=15:00` also pins load time to 15:00 today, so doc sketches and screenshots match. The clock stops while the tab is hidden, with no catch-up burst.

**Live loop.** `registerTicker(name, everyMs, fn)` for things that move; `scheduleAt(name, at('+90s'), fn)` for story beats. A failing ticker logs and the loop continues. Scripts jump time with `window.__mock.advance('90s')` (the `advance` step in `shoot.py` and `browse.py`) instead of waiting.

**Pause.** One app-wide switch that freezes what views show, never the world. Views read through `useLiveSnapshot(value, { everyMs })` (new data once per page cadence, never while paused) and `useHeldList(items, { getId })` (new rows wait behind a "N new · Show" pill that keeps counting). Actions call `markUserAction()` so the user's own result shows even while paused; writes from tickers and beats don't count.

**Reads.** Hooks named `useX` return plain typed objects and re-render only when their slice changes (`useShallow`). List hooks take a filter. Getters named `getX` read the same data outside React.

**Writes.** Action objects per domain (`invoicesActions.refund(id)`) return `Promise<{ ok, message, data? }>`; the UI shows `message` in a toast (`toastResult`). Slow work waits on real timers (`delay()`), so it finishes under `?freeze`. Actions an admin would audit write an audit entry in the same shape the seeded history uses.

**Across domains.** A typed event bus (`on`, `emit` in `core/events.ts`) lets one domain react to another without importing its store. Keep one base domain that imports no other, so cycles can't form.

**Scenarios.** `hasScenario('empty')` in generators; flags are read once at load.

**Size.** The whole world builds in under 300 ms (`timed()` logs each domain's build time in dev). Generate large sets lazily per bucket instead of materialising them.

**Dev page.** Each domain adds `ui/src/features/dev/mock/<domain>.tsx` exporting a `section` (copy `sample.tsx`): counts, samples, and story buttons with test subjects. `/dev/mock` collects it as a tab.

## Adding a domain

1. Copy the `sample` folder's shape: types, generators, one `create()` store built inside `timed('<domain>', build)`, hooks, actions, tickers, an `index.ts` listing the public names.
2. Re-export it from `mock/index.ts`.
3. Add its dev section file.
4. Keep `model.md` true for what you built; facts that differ from `world.md` go in your return message, and the orchestrator decides.

## Pitfalls

- A ticker that rebuilds a whole array every tick re-renders every subscriber. Pages read through snapshots on their own cadence.
- Mock modules are not hot-reload boundaries: an edit reloads every dev server and resets the world. Verify long flows on a private build.
- Building the same objects twice with different generators gives two inconsistent views of one thing. Build once, pass it along.
- Ids derived from load time change on every reload, so pasted links open the wrong object. Derive ids from the seed.
- Blank display fields on one kind of record show up as empty table cells. Fill every field the UI shows, for every kind.
- `?freeze=15:00` pins today's date, so names containing the date change daily. Fine for review, not for pixel diffs across days.
