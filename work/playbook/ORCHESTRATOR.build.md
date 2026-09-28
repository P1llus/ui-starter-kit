# ORCHESTRATOR.md

**Phase: build loop (step 3 of 4).** Entry point for whoever runs the build. If the previous orchestrator crashed or ran out of context: read this file, then `AGENTS.md`, then `docs/README.md`, then continue from the first unchecked item under Status. The playbook is `work/playbook/` (start with `build-loop.md`; `delegation.md`, `review-and-fix.md` and `recovery.md` when you need them). It is for you: point subagents at `work/briefs/` and `docs/` by path, never paste.

The orchestrator plans, delegates, reviews and decides. It does not ask the user for approval; it makes the call and records it where that kind of state lives (the "Where state lives" table in `work/playbook/build-loop.md`: cross-page decisions in `docs/decisions.md`, conventions in `docs/design/conventions.md`, plan and progress here). The user monitors and interrupts if needed. Keep going until every phase below is checked.

<!-- Template from work/playbook/. Written at the end of step 2. Keep this file under ~150 lines while the build runs: move ticked open items out once their fix is committed. -->

## Mission

<The user's request, condensed: what the product is, what the prototype must prove, for whom.>

Success criteria:
1. Every page in `docs/pages/README.md` exists in `ui/`, reachable from the nav, interactive on the mock world, in light and dark.
2. The demo stories in `docs/data/world.md` walk end to end in a live browser.
3. Every page reviewed from screenshots at least twice, every finding fixed or decided, a final sweep of every route and flyout with no console errors or React warnings.
4. Focused docs that match the UI.
5. <project-specific criteria>

What the user wants (standing preferences):
- <preference, in their terms>

What the user explicitly does not want:
- Backend work, API design or feasibility debates. Mocks can do anything.
- Pages that dump every badge, pill and number the data allows.
- Agents inventing pages. The inventory is the scope; changes go through the orchestrator and a decision row.
- Expensive or external work on page render.
- Scripted "reviews" that skip looking at the UI.
- <more, in their words>

## Inputs

- Brief and inventories: `docs/product/brief.md`, `docs/pages/README.md`, `docs/components/README.md`, `docs/ux/navigation.md`, `docs/ux/interactions.md`, `docs/data/world.md` (confirmed by the user on <date>).
- Approved design boards: `design/boards/` at commit <hash> (render with `scratch/render_boards.py`), direction in `design/README.md`.
- Research: `docs/research/`. Intake notes on the user's material: `work/intake/notes/`.
- Briefs: `work/briefs/`.

## Ports

5200-5249 builders · 5250-5299 fixers · 5300 frozen review build (reviewers only; never kill it while reviews run) · 5310 the orchestrator's own look.

## Status

- [ ] P0 Kickoff: tools verified, waves planned below
- [ ] P1 Spec: vocabulary docs (orchestrator); design, component, world docs; page and feature docs; reconciled; commit
- [ ] P2 Foundation: libraries; shared components + /dev/components; mock domains + /dev/mock; shell, routes, placeholders; sample domain removed; commit
- [ ] P3 Pages: every area built; routes.txt complete; commit
- [ ] P4 QA round 1: area, consistency, stories, intent coverage; rulings; shared fixer; area fixers; commit
- [ ] P5 QA round 2: verification, consistency re-check, error sweep; final fix wave; commit
- [ ] P6 Explore and polish: own look, persona walkthroughs, rewrites of weak pages, final sweep, docs audit; commit
- [ ] P7 Wrap-up: maintenance ORCHESTRATOR.md and AGENTS.md; final commit

### Wave plan

<Filled in P0: per phase, the agents (task id, scope, owned paths, port) and what starts each one.>

## Roster

Agents running now. Update on every launch and return; a resumed orchestrator uses this to find orphans and resume agents.

| Task id | Scope | Port | Started | Waiting on / note |
| --- | --- | --- | --- | --- |

## Open items

Loose ends found during the build. Each line: symptom, suspected cause, the rule it breaks, and the fix direction or a ruling. Each becomes part of a fix task; tick it with a few words when done.

## Log

Short dated lines for decisions or surprises that change the plan, usage-limit stops and recoveries.

- <date>: Brief, inventories and design boards approved by the user; build handed to the orchestrator.
