# Frontend

The app lives in `ui/`: a Vite single-page app on in-browser mock data, no backend. This doc holds the stack, the commands, the folder layout and the code rules every builder follows. Screenshots and the tools: [screenshots.md](screenshots.md). The mock world: [data/README.md](../data/README.md).

## Stack

| Package | Version | Notes |
| --- | --- | --- |
| react, react-dom | 18.3 | StrictMode off: EUI doesn't support it (double effects break focus traps and portals) |
| typescript | ~5.9 | Strict. Pinned: npm `latest` may be a major EUI doesn't support yet |
| vite, @vitejs/plugin-react | 8.x, 6.x | Emotion's JSX runtime for the `css` prop |
| @elastic/eui, @elastic/eui-theme-borealis | 122.x, 8.1 | With @emotion/react, @emotion/css, moment, @elastic/datemath |
| @tanstack/react-router | 1.x | File routes via the router plugin |
| zustand | 5.x | Mock state and UI state |
| @fontsource/inter, @fontsource/roboto-mono | 5.x | Borealis fonts, bundled, no CDN |
| eslint, typescript-eslint, prettier | 10.x, 8.x, 3.x | Lint rules below |

Node 24+ (`ui/.nvmrc`), installed with nvm: `nvm install 24 && nvm alias default 24` (in an agent's shell, `source "$NVM_DIR/nvm.sh"` first). Add libraries when the spec needs them and record them here.

## Commands

Run in `ui/` (from the repo root: `(cd ui && npm run build)`).

| Command | Does |
| --- | --- |
| `npm run dev -- --port <port> --strictPort` | Dev server on your own port |
| `npm run check` | Typecheck, lint, format check |
| `npm run build` | Typecheck and production build into `ui/dist/` |
| `npm run routes` | Regenerates `src/routeTree.gen.ts` without a dev server |
| `npm run tokens` | Writes `design/tokens.css` from the installed theme |
| `npm run format` | Prettier on everything |

## Folder layout

```
ui/src/
  main.tsx          fonts, global CSS, starts the mock world and the dev hooks, renders <App/>
  app/              App (EuiProvider + router), router, RootLayout, shell/, flyouts.ts (kind registry), devHooks.ts
  routes/           file routes, thin: the route, its search validation, the page component
  features/<area>/  pages/<Name>Page.tsx, flyouts/<Kind>Flyout.tsx, forms/<Kind>Form.tsx, components/ used only by this area
  features/dev/     /dev pages; mock/*.tsx and components/*.tsx are gallery sections, collected automatically
  components/       shared components, each documented in docs/components/
  lib/              router/ (search validation), url/ (URL state), format/ (the only formatters)
  mock/             the mock world: index.ts (public entry), core/, one folder per domain
  theme/            colour mode (+ ?theme=), fonts, theme overrides
```

Pages are named exports; flyouts are default exports, registered in `app/flyouts.ts`. Import from `src` with `@/`.

## Every state has a URL

The biggest speed-up for building and reviewing: a screenshot of any state is one route string, with no clicks and no reload that resets the world halfway.

| Param | Meaning |
| --- | --- |
| `tab` | Page tab (missing = the first tab) |
| `flyout`, `ftab` | Open flyout `<kind>:<id>` and its tab |
| `form` | Open form flyout `<kind>:new` or `<kind>:<id>` |
| `from`, `to` | Time range |
| filters, `view`, sort | Named per page in its doc |
| `theme` | `light` or `dark` for this load only (screenshots) |
| `freeze`, `world` | Mock clock and scenarios ([data/README.md](../data/README.md)) |

- Read and write params with `useSearchState` and `useUpdateSearch` from `@/lib/url`, and `useFlyout()` from `@/components/flyout`.
- Build every route's `validateSearch` with `tabSearch()` or `searchParams()` from `@/lib/router`: they keep params they don't know. A validator that returns only its own keys strips the flyout, filters and dev flags.
- Typing and filters replace the history entry. Opening a flyout pushes one, so Back closes it.
- Every param a link builds must be read by the target page. Each page doc lists its inbound params.

## Built for scripts

- Dev hooks (`app/devHooks.ts`): `window.__app.navigate(href)` moves without a reload, `window.__app.setColorMode(mode)` flips the theme on the current state, `window.__mock.advance('90s')` jumps the mock clock. Keep them working when you replace the shell.
- `data-test-subj` on anything a script clicks or checks, with stable ids for repeated items (`open-${id}`, `tab-${id}`, `ftab-${id}`). Scripts write `@name` for `[data-test-subj="name"]`.
- Deterministic data: no `Math.random`, no `Date.now` (lint blocks both); use `rng()` and `now()`/`useNow()` from the mock.
- Toasts stack bottom-left, away from flyout footers where the primary action sits.
- A fixed header gets `scroll-margin-top` on scroll targets, so `scrollIntoView` doesn't hide them under it.

## Dev galleries

- `/dev/smoke`: one of each heavy library piece in the current theme. Add a panel when you add a library.
- `/dev/components`: one tab per file in `features/dev/components/`, each exporting a `section` with a shared component on realistic data. Reviewed before pages adopt the component.
- `/dev/mock`: the live loop (tickers, story beats, flags), then one tab per file in `features/dev/mock/` with a domain's counts, samples and story buttons.
- Agents add a section file; nobody edits the gallery pages. Keep the galleries in `scratch/routes.txt`.

## Code rules

- EUI components first, following [EUI](#eui) below. Wrap a component only where its doc in `docs/components/` says why.
- Colours, spacing and fonts from `useEuiTheme()` tokens. No hex values; no magic pixel numbers except documented widths.
- Styling with the `css` prop. No new global CSS without a reason in this doc.
- Mock data only through `@/mock` (lint blocks deep imports).
- In-app links through the router (`AppLink` or `navigate`). A wrapper that drops the click event lets the browser follow the href, which reloads the app and resets the mock world.
- Dates, times, numbers, sizes and durations only through `@/lib/format` (lint blocks `toLocale*`). Conventions: [design/conventions.md](../design/conventions.md).
- State words through `StatusBadge` (`@/components/status`): one word, one colour everywhere.
- Icon names typed as `EuiIconType` from `@/theme`, so a wrong name fails typecheck instead of rendering a blank box. EUI's exported `IconType` accepts any string and checks nothing.
- No `any`. Files under about 300 lines; split by component.
- UI copy: sentence case, plain words, the glossary's terms, no backend words.

## EUI

Memory is usually several majors behind the installed version (122 when the kit was made). These traps each broke builds in the project this kit came from.

- Check a name before using it: `(cd ui && node -e "console.log('EuiCollapsibleNav' in require('@elastic/eui'))")`. `eui.d.ts` also declares internal modules (`EuiFlyoutManager`, `EuiFlyoutChild`, `useFlyoutManager`) that fail to import. For props, read the type in `ui/node_modules/@elastic/eui/eui.d.ts`, or the component's `.tsx` and `*.stories.tsx` in the local clone if AGENTS.md names one. The clone's website docs still show some removed props, and its `main` can run ahead of the installed version (`packages/eui/changelogs/upcoming/`).
- Removed props: `size` on `EuiContextMenu`, `EuiContextMenuPanel`, `EuiContextMenuItem`, `EuiListGroup` and `EuiListGroupItem`; `flush` and `gutterSize` on `EuiListGroup`; `hasDividers` on `EuiSuperSelect` items; `delay` on `EuiToolTip` and `EuiIconTip`; `color="accent"` on `EuiCallOut`; `iconType` and text children on `EuiHeaderLogo` (use `logoType`).
- Removed components: `EuiPageContent`, `EuiPageContentBody` (use `EuiPageTemplate` or `EuiPageSection`), `EuiPageSideBar` (now `EuiPageSidebar`), `EuiLoadingContent` (`EuiSkeletonText`), `EuiCodeEditor`, `EuiControlBar`.
- Side nav: `EuiCollapsibleNav` with `EuiCollapsibleNavGroup` sections, placed in an `EuiHeaderSectionItem` where its toggle `button` renders; `isDocked` keeps it open on wide screens. `EuiCollapsibleNavBeta` and its `Item`/`Button` were removed in v118, and `EuiCollapsibleSideNav` never existed. Example: `collapsible_nav.stories.tsx` (`FullHeaderPattern`) in the clone.
- Flyout sessions (child flyouts, Back, history) are the `session` prop on `EuiFlyout`, not a component to import; `EuiProvider` already mounts the manager. The main flyout gets `session="start"` and a module-level `historyKey={Symbol()}`; a child rendered inside it gets `session="inherit"`. `flyoutMenuProps={{ title }}` names each one in Back and history. Plain flyouts: `session="never"`. Docs: `flyout/_session_management.mdx` and `flyout/manager/README.md` in the clone.
- Managed flyout traps: a child's `size` must be named (`s`, `m`, `l`, `fill`), and a number throws. Main and child can't both be `m` or both `fill`, and `l` pairs only with `fill`. Switching `session` on a mounted flyout closes it, so change its `key` instead. Closing the main closes its children; `onClose(event, { reason })` says why (`close-button`, `escape`, `navigation-back`...), so sync the URL from it and don't close children yourself.
- Icon names models remember that are gone: `arrowDown`/`Up`/`Left`/`Right` (use `chevronSingleDown` etc.), `popout` (`external`), `iInCircle` (`info`), `questionInCircle` (`question`), `plusInCircle` (`plusCircle`), `minusInCircle` (`minusCircle`), `boxesHorizontal` (`ellipsis`), `expand` (`maximize`). Deprecated names still render but avoid them: `search` (`magnify`), `alert` (`warning`), `boxesVertical` (`ellipsis`), `help` (`question`).
- Theme tokens: `colors.textParagraph`, `textSubdued`, `textHeading`, `backgroundBasePlain`, `backgroundBaseSubdued`, `borderBasePlain`; radius `border.radius.control` or `panel`. Not `colors.text`, `colors.emptyShade`, `colors.link` or `border.radius.small`/`medium` (legacy or deprecated). Defaults changed: `EuiPanel` has a border and no shadow, `EuiText` is size `s`, `EuiLink` defaults to `color="text"`.
- React 18 with StrictMode off: EUI supports React 17 and 18 only, and not StrictMode.
- `EuiHealth` renders a `<div>`; inside a `<p>` or `EuiText` paragraph React warns about DOM nesting.

## Before you report

- `npm run check` and `npm run build` pass for your files. Errors only in files another agent is writing: re-run later, and name those files in your return.
- Screenshots of everything you built, light and dark, 1440x900 and key pages at 1280x800, and you opened them.
- The dev log has no new errors or warnings from your pages (Vite prints browser console output in it).
- Your dev server is killed, by PID.

## Tools are a starting point

`scratch/` tools and these helpers are a template, not a rule. The orchestrator improves or rewrites them when a real need shows up. Agents: if a tool has a bug, or lacks something you needed more than once, say so in your return (`Tool bug:` or `Tool request:`, one line). For a one-off need, write a small script in your session folder instead. Don't name scripts after Python standard library modules (`inspect.py` broke another agent's script once).

## Gotchas

EUI and React
- An unknown icon name renders an empty box and logs nothing.
- EUI loads icons lazily. In Vite dev, the first use of a new icon can trigger a dependency re-optimisation ("504 Outdated Optimize Dep"); reload, or run `shoot.py --warmup`. Icons still loading carry `data-is-loading`.
- `app/emotionCache.ts` stops EUI from writing one `<style>` tag per rule (slow big mounts) and skips vendor pseudo-selectors Chromium can't parse.
- `EuiBasicTable` widths in `%` log a warning on every render; use px or em. Its cells use tabular figures, which widen hyphens in Inter; show machine names in `EuiCode` or mono.
- `useId()` returns ids like `:r8g:`; escape them before `querySelector`.

Router and Vite
- TanStack Router re-serialises search values (numbers parsed, arrays as JSON, a bare `?freeze` becomes `?freeze=`). Read params through a parser that accepts both.
- A folder named `index` is an ordinary path segment; only `index.tsx` is an index route. Run `npm run routes` before `tsc` when no dev server regenerated the tree.
- Editing a store or mock module triggers a full reload, not HMR, in every dev server watching the tree.

Libraries you may add
- Elastic Charts: one stylesheet per colour mode (inject the matching one); its dark background is a shade off EUI panels, so use a transparent background. It needs `moment-timezone` 0.5.
- Monaco: bundle it locally (`loader.config({ monaco })` before any editor renders, or it loads from a CDN); derive its themes from EUI tokens; it renders spaces as U+00A0 in the DOM.
- React Flow: map its CSS variables to theme tokens for dark mode; hiding the attribution logs a warning on every load.

Machine
- Several Node managers on one machine: the first shim on PATH wins, and it may pick an older Node than nvm's. Check `which node` and `node --version` in `ui/` when a build fails in odd ways.
- Kill dev servers by PID (`lsof -ti tcp:<port> -sTCP:LISTEN`, or `ss -ltnp` on Linux). `pkill -f vite` kills other agents' servers, and a pattern that appears in your own command line kills your own shell.
