# Brief: writing spec docs

You write the spec for part of the prototype: page docs, component docs or feature docs. Builders implement exactly what you write, in React on mock data. Your doc is the contract between the design intent and the code.

## Read first (in this order)

1. `AGENTS.md`
2. `docs/product/brief.md` and `docs/product/glossary.md`
3. `docs/ux/principles.md`: the rules. Badge budget, one question per page, expensive work on request, no backend words.
4. `docs/ux/navigation.md`: routes, tabs, URL params. Your pages must match them.
5. `docs/ux/flyouts.md`: the flyout kind registry. You define the tabs and content of the flyouts your pages own.
6. `docs/components/README.md`: shared component names. Use exactly these names. If you need a shared component that isn't listed, name it in your return message; don't invent one silently.
7. `docs/pages/README.md`: the inventory, the decided "Not pages", and the page doc TEMPLATE.
8. `docs/design/conventions.md` and `docs/decisions.md`. Component docs that name library components: also the EUI section of `docs/tech/frontend.md`.
9. `docs/data/world.md`: the cast sheet and the demo stories. Facts and numbers come from here.
10. What your task names: intake notes for your area (Summary and your boards), the approved boards in `design/png/` (look at them), research docs.

Load the `unslop` skill (`.agents/skills/unslop/`) before writing.

## What good looks like

- The "Question" is a real user question, answered by the first screen.
- First screen: a small ASCII sketch of what's visible without scrolling at 1440x900.
- Tables list their columns (at most about six for list tables) and say which one is the status element.
- Flyouts you own: tabs (Overview first, at most about four) and what each holds. Overview answers "what is this and is it OK" on its first screen.
- Actions: one primary. Say which actions confirm, which show a preview, which run only on request.
- Inbound URL params: every param another page may link in with.
- Live behaviour: what changes while the page is open, and the page's refresh cadence.
- Mock data: the objects and fields, and which demo story beats show up here. Numbers: say "about" or link to `world.md`; never invent a count that disagrees with it.
- Out of scope: what you cut from the input material and why, one line each.
- Pure intent: no endpoint names, request bodies or internal field names as labels.
- Under 150 lines per page doc.

Component docs follow the template in `docs/components/README.md` (use it for / don't use it for, anatomy, props that matter, behaviour, used by). Feature docs describe behaviour that spans pages, with the rules each page follows.

## Rules

- Write only the files your task lists. Don't edit shared docs (`docs/ux/`, `docs/components/README.md`, `docs/decisions.md`, `docs/pages/README.md`, `docs/data/world.md`) unless your task lists them. If you disagree with a shared rule or fact, say so in your return message with a concrete proposal.
- Don't write code.

Return under 200 words: files written, flyouts defined, shared components you needed that are missing from the inventory, facts you needed that `world.md` lacks, and disagreements with shared docs, each with a proposal.
