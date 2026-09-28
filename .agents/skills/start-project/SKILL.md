---
name: start-project
description: Start a new UI prototype from the ui-starter-kit. Use when the user runs /start-project, or asks to start, set up or kick off a new UI mock, prototype or UI research project in a fresh copy of this kit (ui/, scratch/, docs/ and this skill, but no ORCHESTRATOR.md yet), or when ORCHESTRATOR.md says the project is in discovery. Covers steps 1 and 2 only (setup, the user's material, questions, research, design boards and approval) and ends by writing the AGENTS.md and ORCHESTRATOR.md that drive the autonomous build.
---

# Start a UI prototype project

This kit turns an idea (plus whatever the user already has: notes, design exports, screenshots, API docs, links) into a clickable frontend prototype on in-browser mock data that looks alive, with every page built and reviewed from screenshots and focused docs as the spec. No backend.

This skill covers the first two steps. The build itself is run by an orchestrator from `ORCHESTRATOR.md` and `work/playbook/`; subagents work from `work/briefs/` and `docs/`. None of them need this skill.

## The four steps

| Step | Session | Who drives | Guide |
| --- | --- | --- | --- |
| 1. Setup | This skill run | You, with the user | [reference/step-1-setup.md](reference/step-1-setup.md) |
| 2. Discovery and design | Fresh session from ORCHESTRATOR.md | You, with the user | [step-2-discovery.md](reference/step-2-discovery.md), [step-2-design-boards.md](reference/step-2-design-boards.md), [step-2-handoff.md](reference/step-2-handoff.md) |
| 3. Build loop | Fresh session from ORCHESTRATOR.md | The orchestrator, alone | `work/playbook/build-loop.md` |
| 4. Wrap-up | End of the loop | The orchestrator | `work/playbook/wrap-up.md` |

Steps 1 and 2 each end by telling the user to start a fresh session, so the next step starts with a clean context and reads only the files the previous step wrote. Recommend at least Opus 5.5 at xhigh effort for steps 2 and 3 (what the reference run used), or Fable 5.1 at high effort.

## Which step am I in?

- No `ORCHESTRATOR.md` in the repo root: step 1. Read [reference/step-1-setup.md](reference/step-1-setup.md) and follow it now.
- `ORCHESTRATOR.md` exists: read it. Its first lines name the phase and the files to follow. Don't rerun step 1 unless the user asks for a fresh start; then confirm first and move the old files aside rather than deleting them.

## Rules for steps 1 and 2

1. **Frontend only.** No backend code, no API design, no feasibility debates about real services. Research into real systems exists only to make mocks and copy believable.
2. **Ask before you assume.** Don't move on while an important question is open ([reference/questions.md](reference/questions.md) has the checklist). From step 3 on, the orchestrator decides and records instead of asking.
3. **Write it down, then confirm it.** Every answer lands in a file (brief, inventory, decision row). Show the user a short summary and ask them to confirm or correct it.
4. **Look at the UI.** Anything visual is judged from screenshots opened with the Read tool ([docs/tech/screenshots.md](../../../docs/tech/screenshots.md)).
5. **Calm UI.** Every page answers one question. No badge soup, no KPI tile rows, no data dumps ([docs/ux/principles.md](../../../docs/ux/principles.md)).
6. **Scope is a list.** Pages come from the inventory the user confirmed.
7. **Point, don't paste.** Tell subagents which brief and docs to read by path.
8. **Plain writing.** Load the `unslop` skill (`.agents/skills/unslop/`) before writing docs.
9. **Commands start at the repo root** and use subshells (`(cd ui && npm run build)`), so the shell never drifts into a subfolder.
10. **No remote writes** except pushing this repo to its own remote when the user allowed it.

## Where things live

| Path | What |
| --- | --- |
| `ui/` | The app: Vite, React 18, TypeScript 5, EUI (Borealis), TanStack Router, zustand, a mock core, dev hooks for scripts, a sample page |
| `scratch/` | Python tools (uv): `doctor.py`, `shoot.py`, `browse.py`, `render_boards.py`, `check_links.py`, `sessions.py` |
| `docs/` | Ships with the docs every agent reads (frontend rules, screenshots, principles, conventions, review checklist, the mock world); steps 1 and 2 add the product docs |
| `design/` | `tokens.css` from the real theme and the base for step 2's HTML design boards |
| `work/briefs/` | Task briefs for subagents (step 2 adapts them to the project) |
| `work/playbook/` | How the orchestrator runs steps 3 and 4 |
| `input/` | The user's material, collected here during step 1 (gitignored) |
| `templates/` (this skill) | AGENTS.md, the step 2 ORCHESTRATOR.md, doc skeletons. The build ORCHESTRATOR.md template is `work/playbook/ORCHESTRATOR.build.md`; the canvas template is `design/boards/_canvas-template.html`. |
