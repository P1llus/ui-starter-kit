# Wrap-up (step 4)

The build is done when every phase gate in ORCHESTRATOR.md passed, the final sweep is clean and Open items is empty. Wrap-up turns the build's working files into a repo someone can keep working on, human or agent, without the long brief and without the task lists of the build.

## 1. Last checks

Every block starts at the repo root.

```bash
(cd ui && npm run check && npm run build)
mkdir -p work/sessions/final
(cd ui && nohup npm run dev -- --port 5310 --strictPort > ../work/sessions/final/dev.log 2>&1 &)
for i in $(seq 60); do curl -sf http://localhost:5310/ > /dev/null && break; sleep 1; done
(cd scratch && uv run python shoot.py --base http://localhost:5310 --out ../work/sessions/final/sweep \
  --routes-file routes.txt --theme both --warnings --jobs 4)
(cd scratch && uv run python check_links.py)
```

1. The build passes, the sweep reports zero errors, and zero links are broken. Open a few screenshots you haven't seen yet.
2. No dev servers or browsers left running: kill 5310 and the frozen build on 5300 by PID (`lsof -ti tcp:<port> -sTCP:LISTEN` or `ss -ltnp`), and `browse.py stop` any session.

## 2. Docs are the only truth now

- Remove every doc's dependence on the input material and the design boards: restate the needed fact in place instead of linking to `input/` or `work/intake/`.
- `AGENTS.md` rule "The docs are the spec" stays; drop any rule that pointed at the input material as guidance.
- The design boards stay in `design/` as a record of what was approved. The docs, not the boards, describe current behaviour.
- Check that the docs carry every ruling and intent decision in `work/rulings.md`. Then delete the file; git history keeps it.

## 3. Rewrite ORCHESTRATOR.md for maintenance

From [ORCHESTRATOR.final.md](ORCHESTRATOR.final.md). It becomes the entry point for whoever continues, and it must work without the start-project skill folder (`work/playbook/` and `work/briefs/` stay). Keep:

- Where things stand: what exists, how it was verified, "no open items; new work starts from a user request".
- What the user wants (standing preferences) and what they explicitly don't want. These outlast the build; don't drop them.
- How the build was run: one table of phases with a line each.
- How to run a new wave: scope into docs first; task id, brief, docs, owned files and port per agent; `work/sessions/<task-id>/notes.md`; the frozen build commands for reviews; commit per wave.
- Lessons specific to this project (a gotcha of the chosen libraries, a mock pattern that worked).
- A short log of the events that still matter.

Drop the roster, the open items history and the phase checklists. Git history has them.

## 4. Keep the briefs current

`work/briefs/` stays tracked. Edit each brief so it reads as a reusable method for this project (no references to deleted notes or one-off waves). A future wave starts from them.

## 5. What to leave, and what to tell the user

Don't delete the user's material or the agents' working files. Tell the user what they can delete when they want to:

| Path | What | Size hint |
| --- | --- | --- |
| `work/sessions/` | Every agent's screenshots, scripts and notes (gitignored) | Can reach 1 to 2 GB |
| `work/qa-build/`, `ui/dist/` | Built copies of the app (gitignored) | Tens of MB |
| `work/intake/renders/`, `work/intake/text/` | Renders and conversions of the input (gitignored) | Depends on the input |
| `input/` | What the user brought (gitignored) | Theirs to keep or delete |
| `design/png/` | Board renders; `render_boards.py` makes them again | Small |
| `.agents/skills/start-project/`, `.claude/skills/start-project` | The setup skill; the project no longer needs it | Small |

Keep `work/intake/notes/` only if the intent audit may run again; say so.

## 6. Final commit and report

1. Commit ("Finish the prototype: final sweep, docs audit, maintenance ORCHESTRATOR"). Push if allowed.
2. Save memory notes if your environment has a memory system: the user's standing preferences for this project and anything that surprised you.
3. Report to the user, briefly: what was built (pages, demo stories that walk end to end), how it was checked (rounds, sweep counts), how to run it and what to try first (the README's demo stories), what they can delete, and how to start the next wave ("Read ORCHESTRATOR.md, then <their request>").
