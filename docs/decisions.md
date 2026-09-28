# Decisions

One line per decision that affects more than one page. When a rule seems odd, check here first. Change a row when the decision changes; don't add a second row for the same topic.

<!-- Starter rows from the UI starter kit, for its default stack. Step 1 changes UI-1 and UI-2 if the user picks another component library. -->

| ID | Decision | Why |
| --- | --- | --- |
| D-proto-1 | Frontend-only prototype on in-memory mock data. Reloading the page or restarting the dev server resets all state. | Every page can be tried end to end before a backend exists, and each demo starts from the same known state. |
| D-proto-2 | No data-fetching cache library. Pages read and write zustand mock stores through `@/mock`. | The data already lives in memory; a query cache adds code and nothing else. |
| UI-1 | React 18 with StrictMode off. | EUI supports neither StrictMode nor React 19 yet. |
| UI-2 | EUI with the Borealis theme and its tokens. Wrap components only to fix defaults (density, badge set, flyout anatomy). No separate token system. | A second token set fights the theme for no gain. |
| UI-3 | View state lives in the URL: tab, filters, open flyout and form, time range. | Every view can be linked, reloaded, reached with Back, and screenshotted from a URL. |
| UI-4 | Flyouts overlay the page and never push or squish it. | Push flyouts squeeze the page into unreadable strips. |
| UI-5 | Badge budget: one status element and at most one severity value per table row, two badges per header, one per card. Kinds and counts are text. | A row with several badges can't be scanned. |
| UI-6 | Expensive or external work (lookups, AI summaries, exports) runs only when the user asks; cached results show their age. | No costly calls because a page rendered. |
| UI-7 | Toasts stack bottom-left and only report what the user started. | Flyout footers keep their primary action bottom-right; background changes show as live values and "N new" pills. |
