# Brief: intake review of the user's material

You review a group of the user's input material (design boards, mockups, screenshots, specs). It carries good intent, but earlier AI design rounds usually also produce: inconsistent styling between canvases, too many badges, pills, tables and numbers per screen, pages not reachable from the nav, flyouts drawn so wide the page behind is crushed, invented pages nobody planned, and backend or API detail leaking into UI copy. Your job is to extract what each board is FOR and what is worth keeping, not to describe pixels.

## Read first

1. `AGENTS.md` (if it exists yet) and `docs/product/brief.md`.
2. Your task prompt: your group, the boards (PNG renders in `work/intake/renders/`, captions in its `index.md`), background docs and the sections to skim, and the user's guidance for this group.

## How

- Open every board in your group with the Read tool. If a render is blank or unclear, rerender it (`(cd scratch && uv run python render_boards.py <file> --out ../work/sessions/<task-id>/renders --wait 3000)`) or read the source HTML, and say so in your return.
- Judge as a product designer who hates clutter. Be opinionated. Count badges; call out any screen that can't be scanned in five seconds.
- Ignore backend and API specifics unless the UI needs the concept.
- Where a board depends on what the component library can do, check the library (local clone or docs) before deciding.

## Output

Write `work/intake/notes/<group>.md` with exactly this structure:

```
# <Group>: intake notes

## Summary (max 500 words)
- What this area is for (2 sentences).
- <group-specific verdicts from your task prompt>
- Top 5 ideas worth keeping.
- Top 5 problems across these boards.
- Shared components implied (names and one line each).

## Boards
### <folder>/<board>: <short caption>
- **Intent.** What the board is for, in one or two sentences.
- **Keep.** The ideas worth building.
- **Drop or fix.** Clutter, wrong patterns, backend words, and what to do instead.
- **Data needed.** The objects, fields and states the page needs.
- **Actions.** What the user can do; flag destructive, slow or external ones and whether they should run on request.
```

Max about 200 words per board. Write only your notes file and `work/sessions/<task-id>/`. Don't touch `docs/` or `ui/`.

Return under 150 words: the path written, boards reviewed, blank renders found, and your three most important calls.

Tools: `scratch/` is a starting point. If a tool has a bug, or lacks something you needed more than once, add a line to your return: `Tool bug: ...` or `Tool request: ...`. For a one-off need, write a small script in `work/sessions/<task-id>/`.
