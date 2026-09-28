# Step 2b: design boards

Goal: the user approves how the product looks and how its main patterns work, before hundreds of agent-hours go into building it. You delegate a small set of static HTML canvases, render them to PNG, review them, fix them, and show them to the user.

The boards are samples, not the whole product. Say that to the user up front: "These set the style and the patterns. They are not every page."

Draw the product as it should look. The build styles and composes library components to match the boards, so don't hold them to the library's defaults, or to what the kit's scaffolding in `ui/` happens to have.

## Why canvases, and why split

Earlier design rounds that drew whole pages one by one drifted: each page invented its own badges, headers and flyout sizes, and some agents kept inventing pages without end. So the boards here are split by topic, all use the same tokens (`design/tokens.css`, exported from the real theme) and one shared stylesheet of primitives (`design/boards/_kit.css`), and each canvas is small enough for one agent to finish and check.

## The canvases

Default set. Drop what the product doesn't need, add one for a special surface (a graph editor, a map, a timeline) if the product has one.

| File | Boards | Decides |
| --- | --- | --- |
| `01-shell.html` | Main page with nav, a nested or scoped page if the product has scopes, nav collapsed, first run (empty), dark, 1280 px width | Header, nav structure and width, page padding, page title and description, where global controls live |
| `02-components-core.html` | Type scale, buttons (one primary per view), the status badge set (every state word and its colour), form controls with validation, callout (what is wrong, why, fix), empty states (empty, filtered to nothing, error), key-value list, links | The basic vocabulary. This canvas owns `_kit.css`. |
| `03-components-data.html` | List table (name with a sub-line, one status column, row actions as one icon plus a menu), filter bar, the "N new · Show" row, a status sentence above a table, charts if the product has them (load the `dataviz` skill) | How lists and numbers look |
| `04-overlays.html` | Flyout anatomy over a real page (header with title and at most two badges, tabs, body, footer: leave-page link left, secondary and primary right), child flyout, form flyout, confirm dialog for a destructive action, toast placement, side panel or chat if requested | How detail and editing work without crushing the page |
| `05-pages.html` | Three to five real pages chosen to cover the page templates (a list page, a detail page, an overview, an editor or builder if any), with believable data from `docs/data/world.md` | That the pieces add up to calm pages that answer one question each |

Every canvas shows its key boards in light and dark if the product has both themes. Boards are 1440x900 unless a board needs to show scrolling (then set `--frame-h`).

## Order

1. You write `design/README.md` (under 60 lines): the direction from the brief (density, colour only for state or brand colour too, type, spacing, overlays), the canvas list with owners, and the rules every board follows (below).
2. One agent draws `01-shell.html` and `02-components-core.html`, creating `_kit.css`. Everything else sits inside the shell and uses these primitives, so this goes first.
3. Two agents in parallel: `03-components-data.html` and `04-overlays.html`. They reuse `_kit.css` and may add styles to their own canvas; additions that belong in the kit go into their return message, and you (or the owner, by SendMessage) add them to `_kit.css`.
4. One agent draws `05-pages.html` last, from the brief, the inventories and the finished component boards.

Brief for every board agent: [work/briefs/design-board.md](../../../../work/briefs/design-board.md) (point them at it; don't paste it). Canvas template: [design/boards/_canvas-template.html](../../../../design/boards/_canvas-template.html). Agents load a design skill if the environment has one (for example `artifact-design` for layout fundamentals and `dataviz` for charts) and the `unslop` skill for copy.

Rules for every board:
- Tokens only: colours, sizes, radii and fonts from `tokens.css` variables. No hex values in the canvases.
- Calm: one question per page, one primary action, the badge budget (one status element per table row, two badges per header), no KPI tile rows that repeat a table, no backend words in copy ([docs/ux/review-checklist.md](../../../../docs/ux/review-checklist.md)).
- Believable content from the cast sheet in `docs/data/world.md`. No lorem ipsum, no "Item 1".
- Build it the way the component library can build it. A board that needs a component the library lacks says so in its note.
- Each board has a caption and a one-line note saying what it decides.

## Render and review

```bash
(cd ui && npm run tokens)                                 # if tokens.css is missing or the theme changed
(cd scratch && uv run python render_boards.py --sheet)     # every canvas into design/png
```

Board agents render only their own canvas, into their session folder. You render all of them into the shared folder. This writes `design/png/<canvas>/<board>.png`, `design/png/index.md`, contact sheets and `design/png/gallery.html`. It exits 1 and lists blank renders if any.

Your review, after each agent returns:
1. Open the contact sheets to compare canvases side by side (headers, badges, tables, spacing).
2. Open every board at full size with Read. A board you haven't looked at is not reviewed.
3. Check it against [docs/ux/review-checklist.md](../../../../docs/ux/review-checklist.md) and against the other canvases: the same header, the same badge set, the same table, the same flyout frame everywhere.
4. Send fixes to the agent that drew it (SendMessage keeps its context), or start a fix agent. Rerender. Repeat until you'd show it to the user without apologising.

## Show the user and get approval

1. Tell the user where to look: `design/png/gallery.html` (open it in a browser) and the PNG folder. If your environment can send files or publish a private page, send the gallery or the key boards too.
2. Explain in a few lines what each canvas decides, and repeat that the pages are samples.
3. Ask specific questions rather than "do you like it": density, colour use, navigation, the flyout frame and its width, the table style, the page template, dark mode. AskUserQuestion with multiSelect works well for "which of these need changes?".
4. Change what they ask, rerender, show again. Several rounds are normal. Record each round's feedback in the ORCHESTRATOR.md Log.
5. When the user approves, commit the boards ("Design boards approved"), then record that commit's hash: a decision row ("Design boards approved at commit <hash>: <list>"), a Log line, a second commit.

After approval the boards are the reference for the look and the patterns. Details the component library does differently are fine; patterns, density, colour use and structure must match. In step 3 the spec phase distills the boards into `docs/design/` and the component docs, and builders work from those docs.

Continue with [step-2-handoff.md](step-2-handoff.md).
