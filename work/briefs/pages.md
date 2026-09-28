# Brief: building pages

Read `work/briefs/build.md` first; everything there applies. This adds the page-specific rules.

## What exists

- The shell and routes: every route in `docs/ux/navigation.md` has a thin route file and a placeholder `ui/src/features/<area>/pages/<Name>Page.tsx`. You replace the placeholders you own. Don't edit route files unless your page needs search-param validation (use the helpers in `ui/src/lib/router`).
- Flyouts: every kind has a placeholder at `ui/src/features/<area>/flyouts/<Kind>Flyout.tsx`, already registered in `ui/src/app/flyouts.ts`. Replace the ones you own and keep the props contract in `docs/components/flyout.md`.
- Shared components in `ui/src/components/**`, shown on `/dev/components`. The mock world through `@/mock`, shown on `/dev/mock`; its usage doc is `docs/data/README.md`.

## Rules

- The page doc is the spec. Build what it says, including interactions, empty states, inbound URL params and live behaviour. The design boards show the look; the docs win on content.
- Area-only components go in `ui/src/features/<area>/components/`. If you build something another area will obviously need, say so in your return message rather than putting it in `components/`.
- Missing mock data or actions: add them to the domain that owns the object with small additive changes (new fields, getters, actions) following that domain's patterns, and keep `docs/data/model.md` true. Other agents may edit the same mock files; re-read before editing and never rewrite a file wholesale. List these edits in your return.
- Writes go through mock actions and end in a toast that names the object and one consequence. Destructive actions confirm and state the consequence. Expensive or external work runs only on click.
- Use `?freeze=<HH:MM from the docs>` in screenshot URLs for stable times; also check the live behaviour without it.
- When you finish, update your page doc so it matches what you built (keep the template; where you deviated, say why in one line).

## Done means

- Every route, tab, view and flyout you own renders with mock data, in light and dark, and you looked at the screenshots.
- Every action in the page doc's Actions section does something visible (a state change and a toast, a flyout, a navigation), checked with a flow.
- The first screen answers the page question; the badge budget holds; nothing clips at 1440x900 or 1280x800.
- Links into and out of your pages carry and read the right params.
- No console errors or React warnings from your pages in the dev log.
- Your routes, tabs and one flyout per owned kind are in `scratch/routes.txt`.
