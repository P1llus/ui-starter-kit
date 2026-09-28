# Brief: drawing design boards

You draw one or more static HTML canvases that show how the product looks and how its main patterns work. The user approves these before the build, and every later agent builds from what they settle. They are samples: they set the style and the patterns, not every page.

## Read first

1. `AGENTS.md`, `docs/product/brief.md`, `docs/pages/README.md`, `docs/components/README.md`, `docs/ux/navigation.md`, `docs/data/world.md` (names and states to use).
2. `design/README.md`: the direction, the canvas list and who owns what.
3. The canvases already drawn (`design/boards/`) and `design/boards/_kit.css`: reuse, don't reinvent.
4. The canvas template: `design/boards/_canvas-template.html`.
5. If your environment has design skills, load them: for example `artifact-design` for layout fundamentals, `dataviz` before drawing any chart. Load `unslop` for copy.

## Rules

- One canvas file per topic, several boards each (`<section class="board" data-board="<id>" data-caption="...">`), each board drawn inside `.frame` at 1440x900 unless it needs to show scrolling.
- Tokens only: colours, sizes, radii, fonts from `design/tokens.css` variables. No hex values. Dark boards use `data-theme="dark"` on the section.
- Shared primitives (buttons, badges, inputs, tables, flyout frame) live in `_kit.css`. Only its owner edits it; others propose additions in their return message and keep canvas-only styles in their file's `<style>`.
- Calm UI: every page answers one question with its first screen; one primary action per view; one status element per table row and at most two badges per header; no KPI tile rows that repeat a table; overlays don't crush the page; no backend words in copy.
- Real-sounding content from the cast sheet. No lorem ipsum, no "Item 1".
- Draw what the component library can build. If a board needs something the library lacks, say so in the board note.
- Each board has a caption and a one-line note saying what it decides.

## Verify

```bash
(cd scratch && uv run python render_boards.py ../design/boards/<your-file>.html --out ../work/sessions/<task-id>/png --sheet)
```

Render into your session folder, not `design/png/`: other board agents render at the same time, and only the orchestrator renders the shared gallery. Open every PNG it writes with the Read tool, light and dark. Check: nothing clipped or overlapping, text readable, the same header, badges, tables and flyout frame as the other canvases, the page question answered at a glance. Fix and rerender until you would show it to the user without apologising. Blank renders mean the HTML failed; fix it.

Return under 200 words: canvases and boards drawn, what each decides, additions proposed for `_kit.css`, decisions you made that the user should confirm, and anything from the brief you could not show.
