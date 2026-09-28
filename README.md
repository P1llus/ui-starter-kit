# UI starter kit

Turn an idea into a clickable UI prototype, built by agents. You answer questions and approve the design; an orchestrator then runs many subagents that spec, build, screenshot, review and fix every page. The prototype runs on in-browser mock data that feels alive, and there is no backend.

## Get started

```bash
git clone <this repo> my-project && cd my-project
rm -rf .git && git init -b main    # start clean; the skill offers this too
```
Bring whatever you have: drop files in `input/`, point at them anywhere on disk, paste text or links into the chat when running the skill. Earlier design exports, notes, screenshots, API docs: all fine, none of it is treated as final.

**The quality of the output is related to the quality of the input, features planned more extensively beforehand turns out much better compared to last-minute content**

## Requirements (It will check and confirm after step 1 if you want it to set everything up)

- Node 24+ and npm, via [nvm](https://github.com/nvm-sh/nvm) (`nvm install 24`; `ui/.nvmrc` says 24). fnm, volta, mise or a system Node 24 work too.
- Python 3.10+ through [uv](https://docs.astral.sh/uv/)
- A Chromium: an existing Playwright or system Chrome is found automatically; otherwise the agent installs one into Playwright's cache (about 150 MB)
- git
- Recommended: a local clone of [EUI](https://github.com/elastic/eui) (`git clone --depth 1 --branch v122.1.0 https://github.com/elastic/eui`, the tag matching `ui/package.json`). Agents grep it for components and docs, which is much faster than web search, MCP servers or remote docs. Step 1 asks where it is.
- Disk for screenshots: a big build wrote about 1.5 GB to `work/sessions/` (gitignored, safe to delete afterwards)

## Running it
Assuming you have now provided the input you want, it could be figma exports, pdf's, txt files, claude design exports, api schemas, screenshots or other reference materials in the `input/` folder you start up claude with bypassPermissions `claude --permission-mode=bypassPermissions`. During the first step you can provide either the writeup about your project or link to the files and folders you have prepared for context. The minimal should be the full project description, step 2 will take you through the preparations and ask follow-up questions while step 3 is the long running loop as explained below.

**Opus 5.5 xhigh or Fable 5.1 high recommended, subagents will use different models depending on task either way**

```bash
claude --permission-mode=bypassPermissions # Trigger the /start-project skill together with your initial description of the project or the location of the files/folders you have provided
```

What to expect:

1. **Setup** (`/start-project`). The agent checks your machine and lists anything missing with the exact commands; you run them or tell it to. It collects and reads your material, asks the first questions and starts research. Then it asks you to open a fresh session.
2. **Discovery and design** ("Read ORCHESTRATOR.md and follow it"). A longer conversation. It writes the project brief, page list and demo stories for you to confirm, then has design boards drawn (layout, components, overlays, a few sample pages) and iterates until you approve. Then it writes the build plan and asks for a fresh session.
3. **Build** ("Read ORCHESTRATOR.md and start the build loop"). The orchestrator works alone for hours: specs, foundation, pages, two review rounds, fixes, polish. It won't ask you anything. Watch `ORCHESTRATOR.md` and `git log`, or run `(cd scratch && uv run python sessions.py agents)`.
4. **Wrap-up.** It leaves a maintenance-mode `ORCHESTRATOR.md` and tells you which working folders you can delete.

**Models.** Run steps 1 to 3 on at least **Opus 5.5 at xhigh effort** (what the reference run used). **Fable 5.1 at high effort** also works for the main sessions; it costs more and suits a large or unusual product. The orchestrator picks models for its subagents itself:

| Subagent model | For |
| --- | --- |
| Opus 5.5 (default) | Anything that judges UI or writes code across files: spec writers, builders, fixers, reviewers, story walkers |
| Sonnet 5 | Mechanical work with a clear rule and a small context: link fixes, doc syncs against code, a helper migration spelled out file by file, error sweeps that only report, research summaries |
| Fable 5.1 (rare) | A task that has to hold the whole app in mind or already failed twice on Opus: the cross-page consistency review of a large app, redesigning a page that keeps failing its question, a deep mock-world bug |

If a usage limit stops the build, tell the session "continue"; if the session is gone, start a new one with "Read ORCHESTRATOR.md and continue".

Step 1 runs `scratch/doctor.py`, installs project-local packages itself, and asks before anything system-wide.

## How it works

Optional reading, for when you want to change something.

### Who reads what

The skill in `.agents/skills/start-project/` only guides steps 1 and 2. After that, four kinds of files drive the work, and each agent reads only what it needs:

- `AGENTS.md`: rules every agent reads.
- `docs/`: the spec. Builders build what it says, reviewers check against it. Some docs ship with the kit (frontend rules, screenshot rules, UX principles, conventions, the review checklist, the mock world); the rest is written for your product.
- `work/briefs/`: one brief per kind of task (build a page, review an area, fix findings). A task prompt says "read this brief" plus what's specific, so prompts stay short.
- `work/playbook/`: how the orchestrator runs the build. Subagents never see it.

### Every state has a URL

Tabs, filters, the open flyout and forms live in the URL, so any state can be screenshotted without clicks, and reload, Back and pasted links restore it.

| URL | Shows |
| --- | --- |
| `/?tab=activity` | A page on its second tab |
| `/?flyout=service:svc-billing&ftab=activity` | A flyout for one object, on a tab |
| `?theme=dark` | Dark mode for this load |
| `?freeze` or `?freeze=15:00` | The mock clock stopped (optionally pinned to 15:00), for stable shots |
| `?world=empty` | A scenario, such as first run |

Scripts can also call `window.__app.navigate('/x')` (move without a reload, which would reset the mock world), `window.__app.setColorMode('dark')` and `window.__mock.advance('90s')` (jump the clock so timed events fire now).

### Screenshots, many and fast

Agents never judge UI from code; they take screenshots and open them. The tools make that cheap enough to do hundreds of times per agent, and print every error the page logs along the way.

<details>
<summary>Shoot routes in light and dark, at two sizes</summary>

```bash
(cd scratch && uv run python shoot.py --base http://localhost:5201 --out ../work/sessions/pages-billing/shots \
  --theme both --freeze --sizes 1440x900,1280x800 / "/?tab=activity" "/?flyout=service:svc-billing")
```

Writes `root.png`, `root-dark.png`, `root@1280x800.png` and so on, plus `index.md`. `--routes-file routes.txt --jobs 4 --warnings` sweeps every route in parallel; `--sheet` adds contact sheets; `--compare <old dir>` marks what changed.
</details>

<details>
<summary>A flow: click, check, jump the clock, shoot, in one page session</summary>

```json
[{"name": "restart-billing", "route": "/?flyout=service:svc-billing",
  "steps": [
    {"shot": "billing-before"},
    {"click": "@restartService"},
    {"expect": {"text": "Restarted Billing"}},
    {"advance": "90s"},
    {"shot": "billing-after", "selector": "@flyout-service"}
  ]}]
```

`@name` means `[data-test-subj="name"]`. Other steps: dblclick, fill, type, press, hover, select, check, uncheck, scroll, nav, goto, back, forward, wait, wait_for, theme, eval, text.
</details>

<details>
<summary>What the output looks like, including a failure</summary>

The flow above plus one broken flow, run with `(cd scratch && uv run python shoot.py --base http://localhost:5201 --out ../work/sessions/pages-billing/shots --theme both --flows flows.json)`:

```
== restart-billing light  <- http://localhost:5201/?flyout=service%3Asvc-billing&theme=light
  saved ../work/sessions/pages-billing/shots/billing-before.png
  saved ../work/sessions/pages-billing/shots/billing-before-dark.png
  OK   expect {"text": "Restarted Billing"}
  saved ../work/sessions/pages-billing/shots/billing-after.png
  saved ../work/sessions/pages-billing/shots/billing-after-dark.png
== broken-selector light  <- http://localhost:5201/?theme=light
  FAILED step 1 click "text=Restart everything": Locator.click: Timeout 4000ms exceeded.
    visible candidates:
      @open-svc-billing   <button> 'Billing'
      @tab-activity   <button> 'Activity'
      @open-svc-search   <button> 'Search'
      @tableHeaderCell_name_0   <th> 'Service'
      @tableHeaderCell_owner_2   <th> 'Owner'
      @liveToggle   <button> 'Pause live updates'
      @tableHeaderCell_status_1   <th> 'Status'
      @tableHeaderCell_latencyMs_3   <th> 'p95 latency'
  saved ../work/sessions/pages-billing/shots/broken-selector.FAILED.png (state at the failure)
  step failed: step 1 click "text=Restart everything": Locator.click: Timeout 4000ms exceeded.
  pageerror: Cannot read properties of undefined (reading 'name')
  window.error: Uncaught TypeError: Cannot read properties of undefined (reading 'name')
== 4 shots, 2 error lines, checks 1 ok / 0 failed, 1 flows stopped early. Index: ../work/sessions/pages-billing/shots/index.md
```

With `--theme both`, each shot is taken in light, then again in dark on the same state. The failed flow saved its state as `.FAILED.png` and listed visible elements with ready-to-use selectors. One uncaught error shows as two lines: Playwright's `pageerror` and the in-page `window.error` hook.

Reported per shot: console errors (and warnings with `--warnings`), uncaught exceptions, window errors, failed requests, HTTP errors, the Vite error overlay, and full page loads in the middle of a flow. A flow hit by a full page load or a Vite re-optimize is retried once, with a `(retrying once: ...)` line. Exit code 1 if anything was reported, a check failed or a step failed.
</details>

<details>
<summary>Walking a story in one live browser</summary>

```bash
(cd scratch && uv run python browse.py start --session qa-stories --base http://localhost:5300)
(cd scratch && uv run python browse.py do --session qa-stories '[{"click": "@open-svc-billing"}, {"shot": "01-billing"}]')
(cd scratch && uv run python browse.py do --session qa-stories '[{"click": "@restartService"}, {"nav": "/?tab=activity"}, {"shot": "02-activity"}]')
(cd scratch && uv run python browse.py stop --session qa-stories)
```

The browser stays open between calls, so the mock world keeps its state and clock. The agent looks at each shot before deciding the next step. Each call reports errors since the last one, and whether the page reloaded in between.
</details>

### The mock world

Generated in the browser from a fixed seed at load, so every reload starts from the same state. A story unfolds after load (something fails at +60 s, new rows arrive), tickers move values, and one app-wide pause freezes what views show. Details: [docs/data/README.md](docs/data/README.md).

### Tools are a starting point

Everything in `scratch/` is a template. The orchestrator improves or rewrites tools when agents keep hitting the same limit; agents report `Tool bug:` and `Tool request:` lines in their returns, and write one-off scripts in their own session folder.

<details>
<summary>File map</summary>

Skill (steps 1 and 2):
- `.agents/skills/start-project/SKILL.md`: the four steps and which one you're in.
- `.agents/skills/start-project/reference/step-1-setup.md`: environment, the user's material, first questions, research.
- `.agents/skills/start-project/reference/step-2-discovery.md`: the conversation, brief and inventories.
- `.agents/skills/start-project/reference/step-2-design-boards.md`: the design canvases, review and approval.
- `.agents/skills/start-project/reference/step-2-handoff.md`: writing the build plan.
- `.agents/skills/start-project/reference/questions.md`: what to ask, and when you know enough.
- `.agents/skills/start-project/templates/`: AGENTS.md, the step 2 ORCHESTRATOR.md, doc skeletons.
- `.agents/skills/unslop/`: plain-writing rules for doc writers, the docs audit and the orchestrator.

Playbook (orchestrator only), `work/playbook/`:
- `build-loop.md`: phases, gates, what the orchestrator does itself, where state lives.
- `delegation.md`: task prompts, ownership, ports, concurrency, which brief fits which task.
- `review-and-fix.md`: reviewer types, rulings, fix order, verification rounds.
- `recovery.md`: crashes, usage limits, lost sessions.
- `ORCHESTRATOR.build.md`: the ORCHESTRATOR.md template that step 2 fills in for the build.
- `wrap-up.md` and `ORCHESTRATOR.final.md`: finishing.
- `case-study.md`: the reference run in numbers.

Briefs, `work/briefs/`: `intake`, `research`, `design-board`, `spec-docs`, `mock`, `build`, `pages`, `qa`, `consistency`, `stories`, `intent`, `fix`, `verify`, `sweep`, `docs-audit`.

Docs that ship, `docs/`:
- `tech/frontend.md`: stack, layout, URL params, code rules, gotchas.
- `tech/screenshots.md`: the tools and the rules for looking.
- `ux/principles.md`: the calm-UI rules.
- `ux/review-checklist.md`: what reviewers look for.
- `design/conventions.md`: times, numbers, labels, status, tables, flyouts, links.
- `data/README.md`: how the mock world works.
- `decisions.md`: the decision log.

Tools, `scratch/` (`uv run python <tool> --help`):
- `doctor.py`: checks Node, uv, Chromium, memory, orphan dev servers.
- `shoot.py`: screenshots and flows, with error capture.
- `browse.py`: one live browser across calls.
- `render_boards.py`: HTML design canvases to PNG, with a gallery page.
- `check_links.py`: relative links and anchors in the docs.
- `sessions.py`: every subagent of a session with its task, screenshots read and result.
- `uitools/`: the shared code behind them.

App, `ui/src/`:
- `mock/`: the mock world (`core/` plus a `sample` domain to copy and delete).
- `lib/url/`, `lib/router/`: URL state and search validation that keeps unknown params.
- `lib/format/`: the only date, number and size formatters.
- `components/`: page header, flyout host and frame, status badge, toasts, links.
- `app/devHooks.ts`: the `window.__app` and `window.__mock` hooks.
- `features/dev/`: `/dev` pages; section files are collected automatically.
</details>

<details>
<summary>Where to change the method</summary>

- Rules every agent follows: `.agents/skills/start-project/templates/AGENTS.md` (before a project) or `AGENTS.md` (in one).
- What good UI means: `docs/ux/principles.md`, `docs/design/conventions.md`.
- Component library rules and API traps (EUI names, removed props, side nav, flyout sessions, icons): `docs/tech/frontend.md`, section "EUI". Add a line there whenever agents keep getting an API wrong.
- The review process: `work/briefs/qa.md`, `work/playbook/review-and-fix.md`, `docs/ux/review-checklist.md`.
- Design direction and the boards: `.agents/skills/start-project/reference/step-2-design-boards.md`, `work/briefs/design-board.md`, `design/boards/_base.css`, `design/boards/_canvas-template.html`.
- The questions asked up front: `.agents/skills/start-project/reference/questions.md`.
- Another component library: step 1 swaps it on request and keeps the patterns above.
</details>

### Try the app by hand

```bash
(cd ui && npm install && npm run dev)    # http://localhost:5173, leave it running
```

In a second terminal: `(cd scratch && uv sync && uv run python shoot.py --base http://localhost:5173 --out /tmp/shots --flows flows.example.json)`. Dev pages: `/dev`, `/dev/smoke`, `/dev/mock`, `/dev/components`.


### Stats from last successful usage of the template:

From about 100 agents, 32 pages, two review rounds and a clean sweep of every route in about 20 hours ([case study](work/playbook/case-study.md)).