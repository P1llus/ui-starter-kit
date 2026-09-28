# Recovery: crashes, usage limits, lost sessions

A long build will stop. In the reference run a usage limit stopped every agent and the orchestrator three times, for two to three hours each, and one of them hit 14 seconds after a wave launched. No work was lost, because of how state was kept. This file is the procedure.

## What makes recovery possible

- **ORCHESTRATOR.md is current.** Status, the Roster (task id, port, owned paths, what it was doing), Open items and the Log are updated after every event. A resumed orchestrator knows only what's written there.
- **One port per agent**, so orphan servers are easy to find, and the resume message can say which port to restart on.
- **Exclusive file ownership**, so committing a half-built tree is safe and resumed agents don't fight.
- **Briefs are tracked** in `work/briefs/`, so a relaunched agent reads the same rules.
- **Commits by path** after each finished agent, so the restore point is never hours old.
- **Session folders** (`work/sessions/<task-id>/`) keep each agent's notes and screenshots.

## After a usage limit, same session

The user types "continue" when the limit resets. Then, in under a minute:

1. Find orphan servers and browsers: `ss -ltnp | grep -E ':5[0-9]{3} '`, and `ps aux | grep -E '[c]hrome|[v]ite'`. Kill them by PID, except the frozen QA build on 5300 if reviewers still need it. Stop `browse.py` sessions that belonged to stopped agents.
2. Look at the tree: `git status --short | wc -l`, `(cd ui && npm run typecheck)` (expect errors in files agents were writing).
3. If the tree has real changes, commit a checkpoint ("checkpoint before resuming"). Sanity-check it: `git show --stat HEAD | tail`, and no build output or screenshots in it.
4. Find who was cut off: the failure notifications carry each agent's last message. `(cd scratch && uv run python sessions.py unfinished)` lists every agent without a finished result and its last words.
5. Resume each one with SendMessage to its id. This keeps its full context. Template:

> Resume: you were cut off by an API usage limit (now reset). Continue your task (<task-id>) from where you stopped (<its last step, from the notice>). Your dev server was killed; restart it on port <port> when you need it. The tree was committed as a checkpoint; <n> other agents are resuming at the same time, so re-read files before editing. Finish, verify per the briefs, and return your summary.

6. Decide whether a parent agent needs resuming at all: if you already have all its children's results, you may not need its merge.
7. Update Status and add a Log line ("usage-limit stop at <time>; resumed <ids>").

Use the wait: a limit is a good time to write the next brief.

## After a lost session

The orchestrator's session is gone (crash, context exhausted, closed terminal). The user starts a new session: "Read ORCHESTRATOR.md and continue."

1. Read ORCHESTRATOR.md, AGENTS.md, docs/README.md. Continue from the first unchecked Status item.
2. Map the old session: `(cd scratch && uv run python sessions.py list)`, then `(cd scratch && uv run python sessions.py agents <old-session>)` for every agent with its task and result, and `(cd scratch && uv run python sessions.py timeline <old-session> --out ../work/sessions/recovery/timeline.md)` for what the old orchestrator did last. Read the end of the timeline.
3. Clean up orphans and commit a checkpoint as above.
4. Agents from the old session can't be messaged. Relaunch each unfinished task with its original prompt (from `(cd scratch && uv run python sessions.py agent <id>)`) plus: "Continue from the files already present in your owned paths: another agent started this task and was cut off. Read your session folder work/sessions/<task-id>/ first."
5. Log it.

## After context compaction

Long orchestrator sessions get compacted. The summary keeps the gist, not the details. After a compaction, reread ORCHESTRATOR.md before the next decision, and trust the files over your memory of them.

## Prevention

- Before a big wave: commit, and have the resume message ready.
- Fewer parallel agents means fewer half-finished tasks when a limit hits all of them at once.
- Keep ORCHESTRATOR.md short enough to reread in one go (under about 150 lines while the build runs; move ticked Open items out once their fix is committed).
- Never leave the only copy of a decision in chat. Write it down first, then act on it.
