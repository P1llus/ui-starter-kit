# Brief: building UI

You implement part of the prototype in `ui/` (<stack: React 18, TypeScript strict, component library, TanStack Router file routes, zustand mock world>). The docs are the spec; the design boards set the look.

## Read first

1. `AGENTS.md`
2. `docs/tech/frontend.md` (commands, folder layout, code rules, dev servers, gotchas) and `docs/tech/screenshots.md`
3. `docs/ux/principles.md`, `docs/ux/navigation.md`, `docs/ux/flyouts.md`
4. `docs/design/tokens.md`, `docs/design/layouts.md`, `docs/design/conventions.md`
5. `docs/components/README.md` and the component docs you use or build
6. The page, feature and data docs your task names

## Code rules

- Library components first (check props in the installed version: <where to grep>). Wrap them only where the component docs say so.
- Colours, spacing and fonts from theme tokens. No hex literals; no magic pixel values except documented widths.
- Styling with the `css` prop. No new global CSS unless the task says so.
- Shared components from `@/components/...`; mock data only through `@/mock`.
- All view state in the URL (tab, filters, flyout, form, time range) through the helpers in `@/lib/url` and `@/components/flyout`. Route validators keep unknown params (`@/lib/router`).
- In-app links through the router. Times from `useNow()`, formatting from `@/lib/format`.
- `data-test-subj` on everything a script will click or check, with stable ids for repeated items.
- No `any`. Files under about 300 lines; split by component.
- UI copy: sentence case, plain words, the glossary's terms, no backend words.
- No new dependencies without a reason; name any you add in your return message. Only the agent the orchestrator names may run `npm install` in a wave.

## Ownership

Only edit files your task lists. If a shared file needs a change (a shared component, the mock API, the route tree), make the smallest compatible change, re-read the file right before editing, and list it in your return message. If you add a prop to a shared component, add one line about it to that component's doc. Never reformat or rewrite files you don't own. The generated route tree may change; that's fine.

## Verify before you report

1. `npm run check` and `npm run build` (in `ui/`). Other agents work in the same tree. If errors are only in files you don't own, don't touch them: re-run later, and if they persist, name the files in your return. Your own files must be clean.
2. Start the dev server on your port with `--strictPort`, logging to `work/sessions/<task-id>/dev.log`. Screenshot every route, tab, flyout and form you built in light and dark with `scratch/shoot.py` (URLs first; flows for clicks and typing), at 1440x900 and key pages at 1280x800. Open every PNG with the Read tool. Check: nothing overlaps or clips, the first screen answers the page question, the badge budget holds, dark mode is legible.
3. Click through every interaction you built with a flow (`expect` the result) and screenshot the results. For long flows use a private build on your port, because other agents' edits reload dev servers and reset the mock world.
4. Read the dev log for errors and warnings from your pages.
5. Kill your dev server by PID.

Screenshots go in `work/sessions/<task-id>/`. Return under 200 words: what you built, files touched outside your ownership, known gaps, disagreements with the docs, the screenshot folder.

Tools: `scratch/` and the helpers in `ui/src/lib/` are a starting point. If one has a bug, or lacks something you needed more than once, add a line to your return: `Tool bug: ...` or `Tool request: ...`. For a one-off need, write a small script in `work/sessions/<task-id>/` instead.
