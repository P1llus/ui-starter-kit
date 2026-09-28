# The build loop (step 3)

You are the orchestrator. You plan, delegate, review, decide and record, and you keep going until the prototype is done: every page built, reviewed twice, fixed, verified, explored and polished. You don't ask the user for approval. They watch ORCHESTRATOR.md and the git log, and they interrupt if something goes wrong.

Companion references: [delegation.md](delegation.md) (how to write tasks and run agents in parallel), [review-and-fix.md](review-and-fix.md) (QA, rulings, fix waves, verification), [recovery.md](recovery.md) (crashes and usage limits).

## How you work

- **Decide and record.** A question an agent raises gets an answer from you, written where it belongs ([state table](#where-state-lives)). Never leave it open, never ask the user.
- **Nothing stays open.** Every finding becomes a fix task, a doc change, or a recorded decision to drop it.
- **Delegate the work, keep the judgement.** You write the cross-page rules, briefs, rulings and task prompts. Agents write page docs and all code. Small factual doc fixes you may do yourself.
- **Keep your context clean.** Agents put long output in `work/sessions/<task-id>/notes.md` and return under 200 words. You read summaries and spot-check.
- **Look yourself.** Open at least one screenshot of every major result, and do your own walk of key pages before each milestone commit. Agents miss things; so do you, which is why reviews are layered.
- **Check tool output before fanning out.** A blank render, a red build or a wrong fact in your prompt costs little to catch now and a lot after ten agents built on it.
- **Never block.** Run agents in the background. Run long commands in the background. While agents work, plan the next wave or write the next brief.
- **Point, don't paste.** Tell agents which brief and docs to read by path. This playbook is for you; subagents never need it. Pasting docs into prompts fills every agent's context with text it could have read on demand.
- **The tools are yours.** Everything in `scratch/`, `ui/src/lib/`, the dev pages and these docs is a template. Improve or rewrite a tool when agents keep hitting the same limit or bug (their returns carry `Tool bug:` and `Tool request:` lines). Skip one-off wishes: an agent with a niche need writes a small script in its session folder. Record tool changes in `docs/tech/screenshots.md` or `frontend.md`, and tell running agents by SendMessage when the change affects them.

## Phases

| Phase | Goal | Gate to leave it |
| --- | --- | --- |
| P0 Kickoff | Read everything, verify tools, plan waves | Waves, ports and owners in ORCHESTRATOR.md; commit |
| P1 Spec | Every page, component, feature and the mock world written down, consistent | Every inventory page has a doc, every flyout kind has an owner, facts agree, `check_links.py` passes without `--allow-missing` |
| P2 Foundation | Shell, routes and placeholders, shared components, mock world | Build green; dev galleries look right (you looked) |
| P3 Pages | Every page, tab and flyout built on the mock world | Every route renders; build green; `scratch/routes.txt` complete |
| P4 QA round 1 | Area, consistency, story and intent reviews; rulings; fixes | Every finding fixed or decided; commit |
| P5 QA round 2 | Verify every fix; consistency re-check; error sweep; final fixes | Nothing Not fixed or Regressed; sweep clean |
| P6 Explore and polish | Your own look, persona walkthroughs, rewrites of weak pages, final sweep, docs audit | No open items; docs match the UI |
| P7 Wrap-up | Maintenance-mode files ([wrap-up.md](wrap-up.md)) | Final commit |

### P0 Kickoff

1. Read `ORCHESTRATOR.md`, `AGENTS.md`, `docs/README.md`, the brief, the inventories, `docs/decisions.md`, `design/README.md`. Look at the approved boards: the contact sheets, then a few boards at full size.
2. `(cd scratch && uv run python doctor.py)` and `(cd ui && npm run check && npm run build)`. Kill orphan dev servers.
3. Plan the waves for this project: which areas, how many agents per phase, what depends on what. Write them into Wave plan in ORCHESTRATOR.md. Check the port bands in its Ports section; change them only if the project needs more. Commit.

### P1 Spec: docs before code

**a. Write the vocabulary yourself, before any writer starts.** This is the one job you don't delegate, because every parallel writer has to use the same words. In the reference run, the conflicts that did happen came from conventions left to a writer who ran alongside the page writers.
- `docs/ux/principles.md` final (from the step 2 draft).
- `docs/ux/navigation.md`: routes, tabs, URL parameters (tab, filters, flyout, form, time range), scoping.
- `docs/pages/README.md`: the inventory with a template per page, the "Not pages" table, the page doc template.
- `docs/components/README.md`: exact component names, code folders, the component doc template.
- `docs/ux/flyouts.md` (or overlays): the kind registry, one owner doc per kind, flyout sizes, what pushes and what overlays.
- `docs/data/world.md`: step 2 wrote the cast sheet, the demo stories and what moves. Check them against the approved boards and fix what drifted (names, counts, states, story timings). Numbers other docs quote live there only.
- [docs/design/conventions.md](../../docs/design/conventions.md): confirm or change every starter default. A convention settled after builders start costs a shared fix and an adoption pass over every page (in the reference run, a formatting module written during QA meant migrating about 215 files).
- Decision rows for all of the above.

**b. Writers, in two short waves** with [spec-docs.md](../briefs/spec-docs.md), disjoint files each:
1. Design system docs (`docs/design/tokens.md`, `layouts.md` from the boards), component docs, the rest of the mock world (`world.md` story beats and scenarios, `model.md` objects and fields), research follow-ups.
2. Page docs (one writer per area) and feature docs (behaviour that spans pages), once wave 1 has landed.

Every writer returns "shared components I needed that are missing" and "disagreements with shared docs, with a concrete proposal".

**c. Reconcile.** Queue every proposal and disagreement as it arrives. When the wave is in, decide each one yourself, then give one or two reconcilers ([spec-docs.md](../briefs/spec-docs.md) plus the list) disjoint files and a numbered list marked "all final", plus a grep sweep for known leftovers. Forward items a reconciler can't touch to the other by SendMessage. Run `check_links.py` without `--allow-missing`. Commit.

### P2 Foundation

Order matters: nothing should code against a mock API or a component that doesn't exist yet.

1. Libraries the spec needs (charts, node graphs, editors). One agent owns `npm install` per wave.
2. In parallel: shared components per their docs, each with a gallery file `ui/src/features/dev/components/<name>.tsx` (realistic inline data); the mock core adjustments (seed, scenarios, cast; the agent updates "Using the mock API" in `docs/data/README.md`) and then one agent per mock domain ([mock.md](../briefs/mock.md)), each with `ui/src/features/dev/mock/<domain>.tsx`. The dev pages collect these files on their own, so parallel agents never edit the same page.
3. The shell and routes: every route in `navigation.md` gets a thin route file and a placeholder page; every flyout kind gets a registered placeholder component with a typed props contract. The kit has no form host yet: if any page has a form (`?form=`), the shell agent builds one in `@/components/flyout` and every form kind gets a placeholder at `features/<area>/forms/<Kind>Form.tsx`. Page builders then only replace files they own, and nobody fights over the route tree or the registry.
4. Delete the kit's sample once real pages and domains exist: `ui/src/mock/sample/` and its export in `ui/src/mock/index.ts`, `ui/src/features/home/`, the `service` line in `ui/src/app/flyouts.ts`, `ui/src/features/dev/mock/sample.tsx`, the sample lines in `scratch/routes.txt` and `scratch/flows.example.json`, and the sample events in `ui/src/mock/core/events.ts`. Point `ui/src/routes/index.tsx` at the real landing page. Replace sample ids in the examples of `docs/tech/screenshots.md` with real ones.

Commit each agent's paths as it returns. Gate: build green, and you looked at `/dev/components` and `/dev/mock` screenshots.

### P3 Pages

One builder per area: its pages, tabs, the flyouts those pages own, and its page docs ([build.md](../briefs/build.md) + [pages.md](../briefs/pages.md)). Launch each builder as soon as its dependencies land, not in fixed waves. Shared pieces go FIRST inside their main consumer's task; other consumers get a fallback. Details: [delegation.md](delegation.md).

While builders run:
- Mine every return for loose ends and add them to Open items: symptom, suspected cause, the rule it breaks.
- Relay what one running agent needs from another by SendMessage.
- Open at least one screenshot per builder, picked by risk (the most complex canvas, the first stop of a demo story).
- Keep `scratch/routes.txt` complete: every page, every tab, one owned flyout per kind.

Gate: every route renders with mock data, build green, routes list complete. Commit.

### P4 and P5: QA rounds

Follow [review-and-fix.md](review-and-fix.md). Round 1: area reviewers, one cross-page consistency reviewer, story walkthroughs in a live browser, an intent coverage audit against the intake notes, and a fixer clearing Open items in parallel. You turn consistency findings into rulings; a shared fixer builds the shared pieces first, then area fixers adopt them. Round 2: verify every finding, re-check every ruling, sweep every route for errors, then a final fix wave.

### P6 Explore and polish

1. **Your own look.** Build the latest commit in a git worktree so agents in the tree aren't disturbed, shoot the key screens with `--freeze`, read each PNG, then remove the worktree. In the reference run this caught an underlined nav item that twenty agent reviews had missed.

   ```bash
   git worktree add ../look HEAD
   ln -s "$PWD/ui/node_modules" ../look/ui/node_modules
   (cd ../look/ui && npx vite build)
   (cd ../look/ui && nohup npx vite preview --port 5310 --strictPort > /dev/null 2>&1 &)
   for i in $(seq 60); do curl -sf http://localhost:5310/ > /dev/null && break; sleep 1; done
   (cd scratch && uv run python shoot.py --base http://localhost:5310 --out ../work/sessions/look --theme both --freeze <key routes>)
   kill $(lsof -ti tcp:5310 -sTCP:LISTEN 2>/dev/null || ss -ltnp | grep ':5310 ' | grep -o 'pid=[0-9]*' | cut -d= -f2)
   git worktree remove --force ../look
   ```
2. **Persona walkthroughs** ([stories.md](../briefs/stories.md), with the persona's jobs instead of the demo stories). One agent per persona from the brief, with `browse.py`, doing that persona's jobs without a script: start where they would start, follow what the UI offers. Findings: what is missing, confusing, slow, inconsistent, or answers the wrong question.
3. **Rewrite weak pages.** A page that fails its question after two fix rounds gets a rewrite task: the page doc revised first, then the page rebuilt. Patching a bad page a third time is slower than rebuilding it.
4. **Final polish and sweep** ([sweep.md](../briefs/sweep.md)). One agent fixes every open item, then runs `shoot.py --warnings --theme both` over `routes.txt`, the detail routes and one flyout per kind, on a dev server (a production build hides React warnings), and fixes every error, warning and visual defect it sees.
5. **Docs audit** ([docs-audit.md](../briefs/docs-audit.md)), in parallel, docs only: docs match the UI, `check_links.py` passes, history notes and filler pruned, one decision row per topic, files under about 150 lines.

### P7 Wrap-up

[wrap-up.md](wrap-up.md).

## The rhythm of a turn

When an agent returns:
1. Read its summary. Note the shared files it touched and the gaps it listed.
2. Add loose ends to Open items. Answer its questions with decisions.
3. Spot-check risky work: open a screenshot, skim a diff.
4. Update the Roster and Status in ORCHESTRATOR.md.
5. Commit its owned paths: `git add <paths> && git commit -m "..."`.
6. Launch whatever it unblocked. Relay hand-offs to running agents.

## Where state lives

One place per kind of state. When a rule changes, change it there and nowhere else.

| State | Place |
| --- | --- |
| Rules for every agent | `AGENTS.md` |
| Decisions that affect more than one page | `docs/decisions.md`, one row per topic |
| Conventions (formats, labels, row actions) | `docs/design/conventions.md` |
| Phase status, roster (task id, port, owned paths), open items, log | `ORCHESTRATOR.md` |
| How to do a kind of task | `work/briefs/*.md` |
| An agent's findings and working files | `work/sessions/<task-id>/` (notes.md) |
| Rulings and intent decisions | `work/rulings.md` (tracked), then recorded in the doc each ruling names |

Update ORCHESTRATOR.md after every event that changes the plan. A resumed orchestrator knows only what is written there.

## Commits

- After each finished agent, commit its owned paths. The tree is never "between phases" once waves overlap, so waiting for a phase end means hours without a restore point.
- The whole tree at the end of each wave, after a green typecheck and build.
- A checkpoint before resuming agents after a crash or usage limit.
- Push at milestones, only if the user allowed it.

## Scale and budget

Reference run: 104 agents in about 20 hours. Builders ran 45 to 90 minutes each, with 200 to 350 tool calls and 400k to 700k tokens. Reviewers opened 150 to 750 screenshots each. Usage limits stopped every agent three times, for two to three hours each.

- Cap parallel builders by memory (`doctor.py` estimates it) and by usage budget. Six to eight is a sane default. A limit that hits twelve half-finished agents costs more recovery than one that hits six.
- Before a big wave: commit, and have the resume message ready ([recovery.md](recovery.md)).
