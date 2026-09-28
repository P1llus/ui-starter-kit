# AGENTS.md

Read this before doing anything in this repo. It applies to every agent, including the orchestrator.

<!-- Template from the start-project skill. Replace every <...>; delete these comments. Keep it under ~120 lines: detail goes in the docs it links to. -->

## What this repo is

<Product name> is <one sentence: what it is and who uses it>. <One sentence: the main jobs.>

**This repo is a frontend prototype**: every page in React + <component library>, running on an in-browser mock world. There is no backend. Reloading the page or restarting the dev server resets all data to the same starting point.

The code the kit shipped in `ui/` (shell, sample page, flyout host, sample mock domain) is scaffolding, not a design. Replace any of it. Keep only the contracts the tools rely on: view state in the URL, `?theme` and `?freeze`, the dev hooks, `data-test-subj`, and `@/mock` as the only way into the mock world. What the scaffolding lacks (a collapsible side nav, flyout sessions, a form host) never limits what the design or a spec asks for. Where the library works differently from a board, adapt the design a little and record the decision; don't drop the feature.

Product background: `docs/product/brief.md`. Doc map: `docs/README.md`. Orchestration state: `ORCHESTRATOR.md` (the orchestrator's playbook is `work/playbook/`; subagents don't need it). Task briefs: `work/briefs/`.

## Hard rules

1. **No backend work.** No server code, no API design, no request or response schemas, no debates about whether a real service could support a UI idea. Mock data lives in `ui/src/mock/` and does whatever the UI needs. If a UI idea needs data, invent the data.
2. **The docs are the spec.** `docs/` records what each page is for and how it behaves. The approved design boards in `design/` set the look and the patterns. When the UI and a doc disagree, fix whichever is wrong in the same change.
3. **Calm UI over data dumps.** Every page answers one question first. Follow `docs/ux/principles.md` (badge budget, one primary action, progressive disclosure, expensive work on request). If a screen shows more than a person can scan in five seconds, cut it or move it into a tab or flyout. Calm cuts noise, not capability: the settings, filters and options this audience expects (the brief says how much) stay.
4. **Reuse before you build.** Check `docs/components/` and `ui/src/components/` first. A new shared component needs a doc in `docs/components/`.
5. **Scope is the page inventory.** `docs/pages/README.md` lists every page. Don't add pages; propose them in your return message.
6. **Stay in your lane.** Only edit files your task assigns you. If a shared file needs a change, make the smallest compatible change and list it in your report. Never reformat files you don't own.
7. **Look at what you build.** Screenshot it and open the PNGs. Scripts back up the looking; they never replace it.
8. **No remote writes** except `git push` to this repo's `origin`<, and only the orchestrator pushes | : nobody pushes>. No issues, PRs or comments anywhere.
<9. The user's own rules, one line each, e.g. "No comparisons with other products in UI copy or docs.">

## Stack (decided)

React 18 (StrictMode off), TypeScript 5 strict, Vite, <component library and theme>, Emotion, TanStack Router (file routes), zustand for mock state, <added libraries with their purpose>. Details, folder layout and gotchas: `docs/tech/frontend.md`.

Local clones: grep them instead of searching the web. Don't use MCP servers or remote docs for a library that has a local clone here.
- <library>: `<path>` (<where components and docs are>)

## Tools

- Python tools in `scratch/` (uv): run with `(cd scratch && uv run python <script>)`. Add dependencies to `scratch/pyproject.toml`.
- `doctor.py`: checks Node, uv, Chromium and lists orphan dev servers.
- `shoot.py`: screenshots routes and step flows (click, type, expect, shot) in light and dark, and prints every console error. `browse.py`: one live browser across calls, for walking stories. Usage and the rules for looking: `docs/tech/screenshots.md`.
- `render_boards.py`: renders the HTML design boards to PNG.
- `check_links.py`: checks every relative link in the docs.
- `sessions.py`: maps the Claude Code sessions of this repo (orchestrator timeline, every subagent and its result).
- `scratch/routes.txt`: every route, tab and one flyout per kind, for sweeps. Keep it current.

The tools are a starting point, not a rule. If one has a bug or lacks something you needed more than once, add `Tool bug: ...` or `Tool request: ...` to your return message, one or two sentences; the orchestrator improves the tools. Report it too when you copied a kit script to change it, or wrote your own version of something a tool should cover. For a one-off need, write a small script in `work/sessions/<task-id>/`. Never skip or bend a planned feature, page or check because a tool can't handle it: work around the tool and report it.

## Code rules (short)

Full rules: `docs/tech/frontend.md`.
- Every view state in the URL: tab, filters, flyout (`?flyout=<kind>:<id>`), form, time range. Route validators keep unknown params.
- Mock data only through `@/mock`. No `Math.random`, no `Date.now` (use `rng()` and `now()`/`useNow()`).
- Library components first; theme tokens only, no hex values; the `css` prop for styling.
- In-app links through the router. A full page load resets the mock world.
- `data-test-subj` on what scripts click. Typed icon names. One formatting module.
- `npm run check` and `npm run build` pass for your files before you report.

## Dev servers

Use the port your task gives you, with `--strictPort`. Kill your server by PID when done (`ss -ltnp | grep ':PORT '`); never `pkill -f vite`. Never touch the frozen review build on port 5300.

## Writing docs

- Doc writers, the docs audit and the orchestrator load the `unslop` skill (`.agents/skills/unslop/`). Plain words, short sentences, no filler, no em dashes, sentence case.
- One topic per file. Target under 150 lines; split before 250.
- Docs describe intent and current behaviour, not history. When something changes, edit the doc; delete what no longer applies.
- Link with relative paths. Don't duplicate content another doc owns; link to it.
- Decisions that affect more than one page go in `docs/decisions.md`, one row per topic.

## Reporting back

Keep working files (screenshots, logs, scripts, long notes) in `work/sessions/<task-id>/`. Write long findings to `work/sessions/<task-id>/notes.md` (not `report.md` or `findings.md`, which some harnesses refuse for subagents); if that write is refused, put the essentials in the return message.

The message you return is a short summary: what you did, files touched outside your ownership, open problems, disagreements with a concrete proposal. Under 200 words. Never paste large file contents into it.

An open problem you can fix inside your task, fix. Report only what you could not resolve and why.
