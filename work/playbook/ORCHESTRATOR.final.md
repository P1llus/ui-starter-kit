# ORCHESTRATOR.md

Entry point for whoever continues this project, human or agent. Read this, then `AGENTS.md`, then `docs/README.md`.

<!-- Template from work/playbook/. Written at wrap-up (step 4). It must work without the start-project skill folder. -->

## Where things stand

The first build is done. Every page in `docs/pages/README.md` exists in `ui/`, runs on the mock world, and has been reviewed <n> times: per area, across pages for consistency, and by walking the demo stories end to end. The last sweep covered <n> routes and flyouts in dev mode with no console errors or React warnings. Typecheck, lint and build pass.

There are no open items. New work starts from a user request.

## What the user wants (standing preferences)

- <preference, kept from the build ORCHESTRATOR.md>
- The orchestrator plans, delegates, reviews and decides without asking for approval, and records decisions in `docs/decisions.md`. The user monitors and interrupts when needed.

Things the user explicitly does not want:
- <kept from the build ORCHESTRATOR.md>

## How the build was run

| Phase | What happened |
| --- | --- |
| Setup and discovery | <input taken in, questions, research, brief and inventories confirmed, design boards approved> |
| Spec | <shared UX rules, design system, component docs, page docs, mock world, reconciliation> |
| Foundation | <shell, routes, shared components, mock domains> |
| Pages | <builders per area> |
| QA round 1 | <reviewer types, rulings, fixers> |
| QA round 2 | <verification, re-check, sweep, final fixes> |
| Explore and polish | <own look, persona walks, rewrites, final sweep, docs audit> |

The briefs used for each kind of task are in `work/briefs/` (tracked). Reuse them for new waves.

## Running a new wave

1. Decide the scope and write it into the docs first: a page doc, a component doc, a decision row.
2. Give each agent a task id, the brief that fits (`build.md` + `pages.md` to build, `fix.md` to fix, `qa.md` to review, `stories.md` for walkthroughs), the docs to read, the files it owns, and a dev server port from 5200 to 5299.
3. Agents keep working files in `work/sessions/<task-id>/`, which git ignores, and write long findings to `notes.md`.
4. For reviews, serve a frozen build so fixers can work on the source at the same time. In `ui/`: `npx vite build --outDir ../work/qa-build`, then `npx vite preview --outDir ../work/qa-build --port 5300 --strictPort`.
5. Verify every fix in a later round; run `shoot.py --warnings` over `scratch/routes.txt` on a dev server at the end.
6. Commit each agent's paths when it returns and at the end of each wave. Push to `origin` <only if allowed>.

## Lessons

- <project-specific: a library gotcha, a mock pattern that worked, which reviewer type found the worst bugs>

## Housekeeping

Safe to delete whenever you like (all gitignored): `work/sessions/` (agent screenshots and notes), `work/qa-build/`, `ui/dist/`, `work/intake/renders/`, `work/intake/text/`, `input/`, `design/png/`.

## Log

- <date>: <the few events that still matter>
