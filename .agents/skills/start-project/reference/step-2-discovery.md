# Step 2a: discovery

Goal: understand the project well enough that an orchestrator can build it for hours without asking anything. You write the project brief and the inventories, and the user confirms them. Then the design boards ([step-2-design-boards.md](step-2-design-boards.md)), then the handoff ([step-2-handoff.md](step-2-handoff.md)).

This session starts fresh from ORCHESTRATOR.md. Update its Status checklist and Log as you go; if the session dies, the next one continues from there.

## 1. Catch up

Read, in this order: `ORCHESTRATOR.md`, `AGENTS.md`, `docs/product/brief.md`, `docs/decisions.md`, the Summary sections of `work/intake/notes/*.md`, `docs/research/*.md`, `work/intake/inventory.md`. Look at a few input renders yourself. Then tell the user in a few lines what you understood and what you will ask about.

## 2. The conversation

Work through round 2 of [questions.md](questions.md), area by area. Ask for more material whenever it would help: screenshots of tools they use, a sketch, an API spec, example data, a list of real names.

Rules:
- Don't move on while an important question is open. If the user can't answer, propose an answer, record it as a decision, and list it under "Open for review" in the brief.
- Push back when a wish conflicts with calm UI or with another answer. Say what the conflict is and propose a resolution.
- Watch scope. A prototype with 15 good pages beats one with 40 thin ones. If the list keeps growing, ask the user to rank and cut, and record what was cut.
- Research gaps: start a research agent pointed at [work/briefs/research.md](../../../../work/briefs/research.md) and keep talking while it runs.

## 3. Write the brief and inventories

Write these files. Skeletons for some are in [templates/docs/](../templates/docs/). Keep each under about 150 lines; split before 250.

| File | Holds |
| --- | --- |
| `docs/product/brief.md` | The project description: what it is, who uses it, jobs ranked, what the prototype proves, areas, principles specific to this product, systems it shows data from, what moves live, out of scope, things the user does not want, open for review. This is the "big writeup"; everything else links to it. |
| `docs/product/glossary.md` | The nouns and verbs the UI uses, one line each, and words to avoid. |
| `docs/pages/README.md` | The page inventory: area, page, the one question it answers, template. Plus a "Not pages (decided)" table for ideas that became a tab, a flyout or nothing. This list is the scope of the build. Skeleton: [pages-README.md](../templates/docs/pages-README.md). |
| `docs/components/README.md` | The shared component inventory with exact names and one line each: shell, page header, tables, filter bar, status badge set, flyout frame, forms, empty states, charts, editors. Names used here are the names used in code. Skeleton: [components-README.md](../templates/docs/components-README.md). |
| `docs/ux/navigation.md` | The nav tree, routes, which things are tabs, which open as flyouts, URL parameters. |
| `docs/ux/interactions.md` | The key interactions: what creates, edits, deletes or runs things, what confirms first, what runs only on request. It links to the demo stories in `world.md` instead of repeating them. |
| `docs/data/world.md` | The cast sheet (objects, real-sounding names and counts, the states that must appear), the three to six demo stories step by step, the systems mocked, what moves live. It owns the stories; other docs link here. The build's mock world grows from this ([docs/data/README.md](../../../../docs/data/README.md)). Template: [templates/docs/world.md](../templates/docs/world.md). You write the cast sheet, the demo stories and what moves; the spec phase adds the story beats and scenarios. |

Guidance:
- Pages: one question each, answered by the first screen. If a page needs to answer two questions, it's two tabs or two pages.
- Objects that appear on many pages open in one flyout kind each, everywhere. Only nouns that need a canvas get a full page (an editor, a detail page with several tabs, a builder with a live preview).
- Name things once. The glossary, inventories and later code use the same words.
- No backend detail. Say what the user sees and does. Research facts show up as believable names, states and numbers, never as endpoint paths.

## 4. Confirm

Show the user the result in chat: a short summary of the brief, the page list as a table, the demo stories as one line each, and every item under "Open for review". Point them at the files for detail. Ask them to confirm or correct each part. Loop until they confirm.

Then record it: tick the Status items in ORCHESTRATOR.md, add a Log line ("brief and inventories confirmed by the user"), commit.

## 5. Next

Continue with [step-2-design-boards.md](step-2-design-boards.md) in the same session if context allows. If the conversation used most of the context, update ORCHESTRATOR.md so the next session starts at the boards, commit, and ask the user to start a fresh session with "Read ORCHESTRATOR.md and follow it."
