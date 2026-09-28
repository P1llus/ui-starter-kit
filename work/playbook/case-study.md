# Case study: the reference run

The method in this kit comes from one build. Numbers here help you plan the scale of a new one; lessons explain why the rules are what they are.

## What went in

- About 30 exported design canvases (98 boards) from earlier AI design rounds, five markdown specs, and an old design system that existed only as a claude.ai artifact. Good intent, inconsistent execution: badge soup, KPI rows on every page, flyouts that crushed the page, pages missing from the nav, backend words in the copy.
- A long request from the user: frontend only, calm pages, docs first, full autonomy, never script a review instead of looking.
- Local clones of the component library and a query-language toolkit, so agents grepped instead of searching the web.

## What came out

- A React 18 + TypeScript + EUI prototype with 32 page docs and every page built, running on a mock world with five demo stories that walk end to end.
- About 70 focused docs: product, UX rules, design system, one doc per shared component, one per page, features, the mock world, tech notes.
- Two full review rounds, a final sweep of 156 routes and flyouts with zero console errors or React warnings, 564 doc links checked.

## Shape of the run

| Phase | Agents | Wall time |
| --- | --- | --- |
| Setup and intake (7 reviewers, scaffold, research, product docs) | 10 | 30 min |
| Spec (design system, components, 32 page docs, mock world, 2 reconcilers) | 14 | 1 h |
| Foundation (flyouts and tables, editors and charts with 3 children, 4 mock domains, shell) | 10 | 2 h |
| Pages (14 area builders, 12 at peak) | 14 | 1.5 h active, plus a 3 h usage-limit pause |
| QA round 1 (6 area, consistency, stories, intent audit with 7 children) | 16 | 1 h |
| Fixes (open items with doc-drift children, shared fixer with a 4-lane format migration, 6 area fixers) | 19 | 2 h, plus a 3 h pause |
| QA round 2 (verifiers with 10 children, consistency re-check and error sweep, leftovers fixer) | 14 | 1 h |
| Final fixes, polish, full sweep, docs audit | 7 | 3 h, plus a 2 h pause |

104 agents in about 20 hours of wall time, 1.5 GB of screenshots. Per agent: intake 5 to 9 minutes; doc writers 7 to 23 minutes; builders 45 to 90 minutes with 200 to 350 tool calls and 400k to 700k tokens; reviewers opened 150 to 750 screenshots each. Round 1 produced about 200 findings, round 2 about 25 new ones, the final wave cleared about 160 items.

## Lessons behind the rules

- **The orchestrator writes the vocabulary before fanning out.** Names, routes, the flyout registry, principles and decisions came first, so 8 parallel writers produced 32 docs without two claiming the same flyout. Conventions left to a writer running alongside the page writers caused most of the 25 conflicts the reconcilers fixed.
- **Placeholders for every route and flyout** let builders own exact files. Nobody fought over the route tree.
- **Shared first.** Components before pages; the shared fixer before area fixers. A convention changed late meant one agent changing the shared piece and every area adopting it.
- **Frozen build for reviews.** Parallel dev servers reset each other's mock worlds through hot reload; reviewers on a static build didn't care.
- **Story walks found the worst bugs.** Two blockers (a draft lost on a tab switch, a link that reloaded the app) that six area reviewers missed.
- **Rulings, not votes.** The orchestrator turned consistency findings into final rulings with ids. Area fixers couldn't re-litigate them.
- **Verify, don't trust.** Fixers said every ruling was applied; an independent check found 15 of 20 still drifting.
- **Look yourself.** The orchestrator's own screenshot walk at the end caught an underlined nav item twenty agent reviews missed.
- **Decide late conventions early.** A formatting module written during QA meant migrating about 215 files. That is why [docs/design/conventions.md](../../docs/design/conventions.md) ships with defaults.
- **Commit by path.** Five hours passed without a commit while phases overlapped; a bad rewrite in that window would have had no restore point.
- **Usage limits hit everyone at once.** Three stops, all recovered by killing orphans, committing a checkpoint and resuming agents by message.
- **The tools were the bottleneck.** The first screenshot script only clicked; 63 agents wrote their own Playwright scripts to type, press keys, wait for text and assert. That is why this kit's `shoot.py` has flows, waits and checks, and why `browse.py` exists.
- **Subagents could not write `report.md` or `findings.md`** in that harness; `notes.md` worked. The kit uses `notes.md` everywhere.
