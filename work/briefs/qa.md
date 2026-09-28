# Brief: QA review

You review part of the prototype as a demanding product designer and a user trying to get a job done. You don't fix code in this task (unless your task says so). You produce findings a fixer can act on without asking questions.

## Read first

`AGENTS.md`, `docs/ux/principles.md`, `docs/ux/navigation.md`, `docs/ux/flyouts.md`, `docs/design/tokens.md`, `docs/design/layouts.md`, `docs/design/conventions.md`, the page docs for your area, and `docs/data/world.md` for what the demo stories should show. The checklist of what to look for: `docs/ux/review-checklist.md`.

## How to review

1. Review the frozen build at http://localhost:5300 (a static production build; a reload resets the mock world). Don't start a dev server and never kill the process on 5300. Code may change while you review; findings are about the frozen build. To pin down a cause you may read `ui/src`, but don't edit it.
2. Screenshot every route, tab and view in your scope, every flyout your pages own (open them by URL: `?flyout=<kind>:<id>`), and every form, at 1440x900, key pages also at 1280x800. Use `scratch/shoot.py` (`--theme both`, flows for clicks and typing). Use `?freeze` for stable times, and also check live behaviour without it.
3. LOOK at every screenshot with the Read tool. A finding you didn't see in a screenshot or in the running app is a guess; don't report guesses. Dark mode: <policy from the orchestrator: read every dark shot, or a dark contact sheet per page, or a sample>.
4. Click through every action in each page doc's Actions section with a flow. Note what happens (toast? state change? nothing? error?).
5. Read the error output of every shoot.py run: console errors, window errors, failed requests, mid-flow reloads.

## What to look for

- **Broken:** errors, blank areas, controls that do nothing, wrong data, links that open the wrong thing or reload the app, flyouts that don't resolve their id, URL state that doesn't survive a reload.
- **Spec gaps:** things the page doc promises that aren't there, and things built that the doc doesn't mention (the doc may need an update instead).
- **Principles:** the first screen doesn't answer the page question; badge budget exceeded; KPI tile rows; more than one primary action; backend words in copy; expensive work on render.
- **Visual:** library defaults where the boards show something designed (a plain table, an unstyled panel), the same style override copied page by page, clipping, overlap, wrapping buttons, misaligned columns, inconsistent spacing, unreadable dark mode, charts without units, mono used for prose or missing on machine values, truncation that hides the important part.
- **Consistency:** the same thing looking or behaving differently from other pages.

## Findings format

Write `work/sessions/<task-id>/notes.md` (files named `findings.md` or `report.md` may be refused):

```
## <route or flyout>: <short title>
Severity: blocker | major | minor | polish
Seen: <screenshot file names>
Problem: one or two sentences.
Fix: what should change, concretely (component or file if you know it).
```

Order by severity. No findings about taste you can't tie to a principle, the page doc or a clear usability problem. If the doc is wrong and the UI is right, say "doc fix".

Return under 200 words: counts by severity, the three worst findings, and `Tool bug:` / `Tool request:` lines if a tool got in your way.
