# Brief: building the mock world (ui/src/mock)

The mock layer is the prototype's backend. It is generated in the browser at startup from a fixed seed and lives in zustand stores. A reload or a dev server restart resets everything to the same start. Specs: `docs/data/world.md` (story, cast, what moves; the source of truth for facts), `docs/data/model.md` (objects and fields), `docs/data/README.md` (how to use the mock API), and the "Mock data" sections of the page docs.

Read `work/briefs/build.md` first; its ownership and verification rules apply.

## Conventions

- **Layout.** `ui/src/mock/index.ts` is the only public entry (`import { ... } from '@/mock'`). `core/` holds the seeded random, clock, flags, ids, live loop and pause, event bus. One folder per domain with `types.ts`, `data.ts` (or `data/`), `store.ts`, `hooks.ts`, `actions.ts`, `tickers.ts`, `index.ts`. The `sample` domain shows each file's shape.
- **Determinism.** Generators never call `Math.random` or `Date.now` (lint blocks both). They use `rng('<domain>', what, key)` streams keyed by what they generate, `noise()` for pure per-bucket values, and the clock helpers (`now()`, `at('-47m')`).
- **Stores.** One zustand store per domain, built once at module load inside `timed('<domain>', build)`. No persistence.
- **Reads.** Hooks named `useX` returning plain typed objects; `useShallow` or stable selectors so components don't re-render on every tick. Getters named `getX` for code outside React.
- **Writes.** Action objects per domain (`<domain>Actions.verb(...)`) that mutate the store, may simulate slow work with real timers (`delay()`), write an audit entry when an admin would want one (same shape as seeded history), call `markUserAction()`, and resolve to `{ ok, message, data? }` for a toast.
- **Live.** Register tickers (`registerTicker('<domain>.<what>', everyMs, fn)`) and story beats (`scheduleAt('<domain>.<beat>', at('+90s'), fn)`) per `world.md`. Pause freezes views, never the world.
- **Across domains.** Import another domain only through its `index.ts`, and only from the base domain outward; to react without importing, use `on()`/`emit()` from `core/events.ts` and add the event to `MockEventMap`.
- **Scenarios.** `hasScenario('<name>')` for `?world=<name>` variants listed in `world.md`.
- **Size.** The whole world builds in under 300 ms. Generate large sets lazily per bucket instead of materialising them.
- **Ids.** Readable, deterministic, stable across reloads (`svc-billing`, `inv-1042`); `sequence()` for objects created at runtime.
- **Believable.** Names, distributions and edge cases from `world.md` and `docs/research/`: some failures, an empty one, long names, big numbers, messy real-world values. Every display field filled for every kind of record.

## Verify

- `npm run check` and `npm run build` pass for your files.
- Add `ui/src/features/dev/mock/<domain>.tsx` exporting `section` (see `sample.tsx`): counts, a few samples, and buttons (with `data-test-subj`) that trigger its story beats. `/dev/mock` collects it as a tab. Screenshot it and look.
- Walk each story beat you own with `shoot.py` flows or `browse.py`, using `{"advance": "90s"}` instead of waiting.
- Keep `docs/data/model.md` true for what you built; list any fact you had to change in `world.md` in your return (the orchestrator decides).

Return under 200 words: hooks, actions and tickers added, story beats working, facts that differ from the docs, shared files touched.
