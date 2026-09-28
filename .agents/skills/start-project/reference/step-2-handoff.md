# Step 2c: handoff to the build loop

Goal: everything a fresh orchestrator needs to build the whole prototype without asking the user anything. Then stop and tell the user how to start the loop.

The orchestrator reads `ORCHESTRATOR.md`, then `AGENTS.md`, then `docs/README.md`, and follows `work/playbook/`. Anything it needs to know about the user's wishes has to be in those files or in docs they link to. The conversation you had does not travel.

## 1. Write AGENTS.md

Complete the one step 1 started (template: [templates/AGENTS.md](../templates/AGENTS.md)). Every agent reads it, so keep it under about 120 lines and link to docs for detail:

- What the repo is, in three sentences, and that it's frontend only on mock data that resets on reload.
- Hard rules: keep the kit's defaults unless the user decided otherwise, and add the user's own "never do this" items.
- The stack with versions, and local clones to grep instead of MCP servers or remote docs.
- The tools, the rule to look at screenshots, and how to report a tool bug or request.
- Doc and reporting rules.

## 2. Write ORCHESTRATOR.md for the build

From [work/playbook/ORCHESTRATOR.build.md](../../../../work/playbook/ORCHESTRATOR.build.md). Replace the discovery version entirely. Fill in:

- Mission: the user's request condensed, what the prototype must prove, success criteria.
- Standing preferences and the "does not want" list, in the user's own terms where possible. The final ORCHESTRATOR.md keeps these, so write them to last.
- Inputs: approved boards (commit hash), the brief, inventories, research, intake notes.
- The Status checklist adjusted to the project (for example drop the intent coverage review if the user brought no design material).
- Empty Roster and Open items, and the Log lines from steps 1 and 2 that still matter.

## 3. Adapt the briefs in work/briefs/

The kit ships generic briefs in `work/briefs/`. Edit each in place for this project: the stack if it changed, the page templates, names from the cast sheet, the user's guidance that applies to that kind of task. Set the dark-mode review policy in `qa.md`; the orchestrator may revise it before QA. Keep briefs for tasks the project won't run, because the playbook links every brief; add `Not used in this project: <why>` as the first line. Task prompts then stay short: "Read work/briefs/build.md and follow it", plus what is specific to the task.

`work/playbook/delegation.md` has the table of which brief fits which task.

## 4. Adapt the docs that shipped with the kit

These are already in `docs/`; make them true for this project:

| Doc | What to change |
| --- | --- |
| `docs/ux/principles.md` | Examples from the product; rules the user added or dropped |
| `docs/design/conventions.md` | Defaults that don't fit the approved boards (the orchestrator confirms the rest in the spec phase) |
| `docs/tech/frontend.md` | Libraries the user picked, and anything the boards need that the stack lacks |
| `docs/data/README.md` | Nothing yet; the mock core agent updates it in the build |
| `docs/decisions.md` | Every decision from steps 1 and 2 |
| `docs/README.md` | Links to the product docs, research and inventories you wrote |

Also fill `scratch/routes.txt` with one line per page and tab from the inventory, even though the routes don't exist yet. Builders and reviewers extend it.

Check links: `(cd scratch && uv run python check_links.py --allow-missing)`. Links to docs the spec phase writes (component docs, `ux/flyouts.md`, `design/layouts.md`) are listed, not failed. The spec phase ends with the strict check.

## 5. Commit and stop

Commit ("Brief, inventories, approved design boards and build plan"). Push only if allowed. Then tell the user:

- What the build will do, in a few lines: the phases, roughly how long (scale it from the reference run in [work/playbook/case-study.md](../../../../work/playbook/case-study.md)), and that it won't ask them anything.
- How to watch it: `ORCHESTRATOR.md` (Status, Roster, Open items, Log), the git log, and `(cd scratch && uv run python sessions.py agents)` for every subagent with its task and result.
- What to do if it stops: after a usage limit, tell the same session "continue"; if the session is gone, start a new one with "Read ORCHESTRATOR.md and continue" (`work/playbook/recovery.md`).
- How to start:

> Start a new Claude Code session in this folder on at least Opus 5.5 at xhigh effort (or Fable 5.1 at high), and say: **Read ORCHESTRATOR.md and start the build loop.**

Then stop.
