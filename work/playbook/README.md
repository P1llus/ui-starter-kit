# Playbook

How the orchestrator runs the build (step 3) and finishes it (step 4). This folder is for the orchestrator. Subagents don't read it: their prompt names a brief in [work/briefs/](../briefs/) and the docs they need.

| File | Read it |
| --- | --- |
| [build-loop.md](build-loop.md) | At the start of the build and at every phase change: phases, gates, what you do yourself, where state lives, commits, budget |
| [delegation.md](delegation.md) | Before writing task prompts: prompt anatomy, ownership, ports, dependencies, concurrency, hand-offs, which brief fits which task |
| [review-and-fix.md](review-and-fix.md) | Before QA: reviewer types, task ids, findings, rulings, fix order, verification |
| [recovery.md](recovery.md) | After a crash, a usage limit or a lost session |
| [ORCHESTRATOR.build.md](ORCHESTRATOR.build.md) | At the end of step 2: the template for the build ORCHESTRATOR.md |
| [wrap-up.md](wrap-up.md) | When every phase gate has passed |
| [ORCHESTRATOR.final.md](ORCHESTRATOR.final.md) | Template for the maintenance-mode ORCHESTRATOR.md written at wrap-up |
| [case-study.md](case-study.md) | To calibrate scale: the reference run in numbers, and the lessons behind these rules |

Everything here is a starting point. When the project teaches you a better way, change the file and say why in the ORCHESTRATOR.md log.
