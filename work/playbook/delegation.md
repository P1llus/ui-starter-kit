# Delegation (step 3)

How to write tasks, give agents what they need, and run many of them in one working tree without collisions. Everything here comes from what worked, or broke, in the reference run.

## Anatomy of a task prompt

A brief file carries the method for a kind of task; the prompt carries only what is specific. Keep prompts to 1,000 to 3,000 characters. Name the files an agent needs by path; never paste a doc, a brief or this playbook into a prompt. The agent reads what it needs, when it needs it.

1. First line: `Task id: <id>. Repo: <path>. Read work/briefs/<brief>.md and follow it.` Name skills to load (`unslop` for docs, `dataviz` for charts).
2. For anything that runs the app: `Dev server port: 52NN (--strictPort).` Unique per agent.
3. The job in one paragraph, including what earlier material gets wrong, so the agent doesn't copy it.
4. The user's guidance that applies to this slice, quoted as such.
5. Inputs: exact paths, and which sections to read.
6. Output: exact files, required structure, length limits.
7. Ownership: `You own: <paths>.` Name allowed shared edits explicitly ("mount FlyoutHost in the shell").
8. Coordination: which agents run now and on what; what to do if a dependency isn't there yet.
9. Verification (usually in the brief): typecheck, build, screenshots light and dark, looked at, dev server killed.
10. Return: under 200 words, with fixed fields (what was done, files touched outside ownership, gaps, disagreements with a proposal, screenshot folder, and `Tool bug:` / `Tool request:` lines if any).
11. Stance: "Decide, don't hedge. Where sources disagree, pick one and say why in one line."

Before you send it, check your own facts against the docs. In the reference run the orchestrator once told a fixer "risk 86 (critical)" while the tokens said 70 to 89 is High; the fixer caught it only because it stopped to ask. If the prompt and a doc disagree, fix the doc first: the docs are the spec.

## What you do yourself

- Vocabulary docs before fan-out (names, routes, registry, conventions, cast sheet).
- Briefs, task prompts, rulings (`work/rulings.md`), open items.
- Decision rows in `docs/decisions.md`, including the ones rulings need. Fixers record a ruling in the doc it names, never in the decision log.
- Small factual doc fixes (a count, a name) that don't justify an agent.
- Your own visual checks.

Everything else goes to agents: docs per area, all code, all reviews, all fixes.

## Ownership

Parallel agents share one working tree, so every task lists what it owns.

- Own whole folders where you can (`ui/src/features/alerts/**`, `docs/pages/alerts/**`). Where several agents share a folder, list exact file names, and use the placeholder names that already exist.
- A shared file gets only "the smallest compatible change", listed in the return message. Never reformat or rewrite a file you don't own. Re-read a shared file right before editing it.
- An agent that adds a prop to a shared component adds one line about it to that component's doc. Silence here caused 15 drifted component docs in the reference run.
- One agent per wave runs `npm install`. Others name the package they need and stop.
- Generated files (the route tree) may change; that's fine.

## Ports and servers

- Each agent gets its own dev server port and uses `--strictPort`, so a clash fails loudly instead of screenshotting another agent's server.
- Kill by PID from `ss -ltnp | grep ':PORT '`. Never `pkill -f vite`: it kills other agents' servers, and a pattern in your own command line kills your own shell.
- Every Vite server watches the same source tree, so another agent's edit to a store or mock file triggers a full reload that resets the mock world mid-flow. For long flows, verify on a private build: `npx vite build --outDir ../work/sessions/<id>/dist` and `npx vite preview --outDir ../work/sessions/<id>/dist --port <port> --strictPort`. Use the dev server for warnings (a build hides React warnings).
- `npm run typecheck` fails on files other agents have half-written. Agents check that their own files are clean, re-run later, and name the foreign files in their return. You run the whole-tree green gate at wave ends.

## Dependencies and order

- **Dispatch on dependency, not on phase.** Launch a builder the moment the mock domain and components it needs have landed.
- **FIRST.** When one builder produces a shared piece others need, its prompt starts with: "FIRST (other pages wait on it): build <Component> in <path> per <doc>. Typecheck it and move on." If others wire it in right away: "FIRST create <path>/index.ts exporting `<Name>(props)`; a stub is fine at first."
- **Fallback in every consumer.** "<Component> is being built by another agent right now. If it isn't there when you reach it, build everything else first and come back. If it still isn't there at the end, leave a clearly marked TODO slot and say so." "Build <page> LAST: it reads hooks other agents are finishing."
- **Interface first.** When code on both sides of a contract is written at once, put the TypeScript interface in both prompts and say "keep the names".
- **Placeholders.** The foundation creates a placeholder for every route and every flyout kind, so ownership can name exact files and builders only replace them.

## Which model

Subagents inherit the session model unless the Agent call sets one. Choose by how much judgement the task needs and how much it has to read and hold:

| Model | Use it for | Signs you picked wrong |
| --- | --- | --- |
| Opus 5.5 (default) | Judging UI from screenshots, writing code across several files, spec writing, reviews, fixes, story walks | None: it is the safe default |
| Sonnet 5 | Mechanical tasks with an exact rule and a small context: link fixes, syncing a doc with code, a migration you spelled out file by file, sweeps that only report errors, summarising research | It returns vague findings, misses the rule in some files, or asks questions a clear brief answers: rerun on Opus |
| Fable 5.1 | Rare. A task that must hold the whole app in mind or already failed twice on Opus: the consistency review of a large app, redesigning a page that keeps failing its question, a deep bug in the mock world or the flyout system | It costs far more; don't use it for anything a brief and Opus can do |

Never use a smaller model for a reviewer or a builder to save budget: a missed finding costs a fix round later. Save budget with fewer parallel agents instead.

## Concurrency

- Default six to eight builders at once. Check memory with `doctor.py` (each runs Vite, tsc and Chromium) and remember the usage budget: a limit hits every running agent at the same moment.
- Queue the rest in the Roster with the trigger that starts each one.
- Reviewers are cheaper on memory (one frozen build serves all of them) but expensive on tokens (hundreds of screenshots each).

## Hand-offs while agents run

When a finished agent reports something a running agent must do, relay it with SendMessage instead of starting a new task. End the message with "List it in your return message." The same works for grandchildren: when a subagent's own subagent reports a likely bug, add it to Open items.

Resume a stopped agent the same way: SendMessage to its id keeps its full context ([recovery.md](recovery.md)).

## Returns

- Findings and long output go to `work/sessions/<task-id>/notes.md`. Some harnesses refuse subagent writes to files named `report.md` or `findings.md`; `notes.md` works. If a write is refused, the essentials go in the return message.
- Returns stay under 200 words with fixed fields. The fields that matter most: files touched outside ownership, known gaps, disagreements with a concrete proposal. Those three lists feed Open items and the next wave.
- An agent that fixes a problem inside its task fixes it; it reports only what it could not resolve and why.

## Nested agents

Agents may start their own subagents for big tasks (a builder splitting charts, forms and builders; a verifier splitting areas). Allow it, and say in the prompt that the parent stays responsible for the result and the return format. Child notifications may reach you directly; harvest their findings.

## Tasks and their briefs

| Task | Brief |
| --- | --- |
| Intake review | [intake.md](../briefs/intake.md) |
| Research | [research.md](../briefs/research.md) |
| Design boards (step 2) | [design-board.md](../briefs/design-board.md) |
| Spec docs, reconcilers | [spec-docs.md](../briefs/spec-docs.md); a reconciler also gets your numbered "all final" list and owns only the files named |
| Mock domains | [build.md](../briefs/build.md) + [mock.md](../briefs/mock.md) |
| Shared components, shell, page builders | [build.md](../briefs/build.md) (+ [pages.md](../briefs/pages.md) for pages) |
| Area review | [qa.md](../briefs/qa.md) |
| Consistency review and re-check | [consistency.md](../briefs/consistency.md) |
| Story walks, persona walks | [stories.md](../briefs/stories.md) |
| Intent coverage | [intent.md](../briefs/intent.md) |
| Shared fixer, area fixers, leftovers | [fix.md](../briefs/fix.md); the shared fixer's prompt lists the shared pieces to build and says "don't migrate pages" |
| Verification | [verify.md](../briefs/verify.md) |
| Final polish and sweep | [sweep.md](../briefs/sweep.md) |
| Docs audit | [docs-audit.md](../briefs/docs-audit.md) |

## Prompt templates

Intake review (step 1, and later waves with new material):

```
Task id: intake-<group>. Repo: <path>. Read work/briefs/intake.md and follow it.
Your group: <name>: <what these boards cover>.
Boards: work/intake/renders/<folder>/*.png (view each with Read). Captions: work/intake/renders/index.md.
Images the user brought for this group: input/<path>/*.png.
Background (skim only): <doc> §<sections>.
Important user guidance: <quote>.
Write work/intake/notes/<group>.md. Return under 150 words: boards reviewed, your 3 most important calls.
```

Page docs:

```
Task id: docs-<area>. Repo: <path>. Read work/briefs/spec-docs.md and follow it.
Your pages (one doc each, template in docs/pages/README.md):
- docs/pages/<area>/<page>.md (<the page's question>; owns flyout kinds <kinds>; <the key call to make>)
Intake notes: work/intake/notes/<group>.md. Boards: design/png/05-pages/<board>.png.
```

Page builder:

```
Task id: pages-<area>. Repo: <path>. Read work/briefs/build.md and work/briefs/pages.md and follow both.
Dev server port: 52NN (--strictPort).
Build per docs/pages/<area>/*.md: <dense list of what must exist: views, filters, flyouts and their tabs,
actions, live behaviour>. <Dependency on an in-flight shared piece, with the fallback.>
Prove it with <one demo story step>.
You own: ui/src/features/<area>/** and docs/pages/<area>/*.md. Mock <domain> is finished; additive edits allowed.
```

Fix and verify prompts are in [review-and-fix.md](review-and-fix.md).
