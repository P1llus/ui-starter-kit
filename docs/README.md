# Docs

Short, focused files; each folder has one job. The docs are the spec: builders build what they say, reviewers check against them, and when the UI and a doc disagree, one of them gets fixed in the same change.

The kit ships the docs every project needs from day one. Steps 1 and 2 add the product docs, and the spec phase of the build adds the rest (named in backticks below until they exist).

| Folder | What goes there | Read it when |
| --- | --- | --- |
| `product/` | `brief.md` (what the product is, who uses it, the jobs, what the prototype proves), `glossary.md` | Always, before any task |
| `research/` | What the real systems and the domain look like, for believable mocks and copy | When mocking or naming things from that system |
| [ux/](ux/) | [principles.md](ux/principles.md) (the calm-UI rules), [review-checklist.md](ux/review-checklist.md), then `navigation.md` (routes, tabs, URL params), `flyouts.md` (the flyout kind registry), `interactions.md` | Before designing, building or reviewing any page |
| [design/](design/) | [conventions.md](design/conventions.md) (times, numbers, labels, status, tables, flyouts, links), then `tokens.md` and `layouts.md` from the approved design boards | Before styling anything or writing UI copy |
| `components/` | `README.md` (the inventory and doc template), one file per shared component | Before building UI; check here before creating a component |
| `pages/` | `README.md` (the inventory, the scope and the page doc template), one file per page, grouped by area | Before building or changing a page |
| `features/` | Behaviour that spans pages | When a page touches that feature |
| [data/](data/) | [README.md](data/README.md) (how the mock world works), then `world.md` (cast, stories, beats) and `model.md` (objects and fields) | Before adding or reading mock data |
| [tech/](tech/) | [frontend.md](tech/frontend.md) (stack, layout, code rules, gotchas), [screenshots.md](tech/screenshots.md) (tools and the rules for looking) | Before writing code or taking screenshots |
| [decisions.md](decisions.md) | One line per decision that affects more than one page | When a rule seems odd, check here first |

How the build itself is run (for the orchestrator, not every agent): `work/playbook/`. Task briefs: `work/briefs/`.

## Rules for these docs

- Intent and current behaviour only. No history, no version notes.
- One topic per file, under 150 lines as a target; split before 250.
- Page and component docs follow the templates in their folder's README.
- Link with relative paths; link instead of repeating another doc.
- Doc writers, the docs audit and the orchestrator load the `unslop` skill (in `.agents/skills/`) before writing.
- `(cd scratch && uv run python check_links.py)` checks every relative link and anchor; `--allow-missing` until the spec phase has written every linked doc.
