# What reviewers look for

Two layers. The first is the clutter AI design rounds produce by default. Write rules against it before building (principles, badge budget, conventions) and it mostly disappears. The second is what QA finds once the first layer is under control: contradictions, dead ends, lost state and drift between pages. Every finding cites a screenshot the reviewer opened and ties to a principle, the page doc or a clear usability problem.

## Layer 1: clutter

1. **Badge soup.** Count them. One design board had about 45 badges in 7 rows. Rule: one status element per table row plus at most one severity or risk value, two badges per header, one per card. Kinds, types, counts and tags are plain text.
2. **KPI tile rows** that repeat the table below. Show one status sentence ("2 services failing") that filters the table, only when it's not zero. Overview pages may have up to four summary tiles.
3. **Flyouts that crush the page.** A 640 px flyout plus a 480 px child leaves 88 px of a 1440 px page. Flyouts overlay; child flyouts are narrow; builders with a preview are full pages.
4. **Backend words in copy.** Endpoint paths, internal field names, ids as labels, config keys, "lease 10 min", decision ids. Say what it means for the user.
5. **Section names that describe storage** ("Evidence · pointers into the source") instead of meaning ("Events").
6. **Expensive or external work on render.** Third-party lookups on flyout open, AI summaries on load, live sparklines on thousands of rows. Make it a button with a cached result that shows its age.
7. **Too many controls before the first row.** Twenty controls above a table means the page answers several questions. Split it.
8. **Tab sprawl.** Seven tabs on a flyout, nine boxed sections on an overview. Merge, move detail one level down, or cut.
9. **Action overload.** Seven actions across a callout and a footer; the same action in both. One primary per view.
10. **One problem, several homes,** each with its own fix button and a different verdict.
11. **Invented pages and pages missing from the nav.** Everything in the inventory is reachable from the nav; nothing outside it exists.
12. **Designer notes drawn as UI** ("trigger kinds: now / later", a resolution ladder).
13. **Mixed words for one thing** (step vs node, Run vs Re-run vs Retry).
14. **A hand-made second palette** where the component library already has one.

## Layer 2: what QA finds

15. **The page contradicts itself.** "All healthy" above rows that say "11 findings need attention". A number in the header that differs from the table.
16. **Links that dead-end.** "Open in X" lands on an empty or error state because the mock lacks that data.
17. **Lost state.** A tab switch drops URL parameters and a draft with them. A link does a full page load and resets the mock world. Closing a flyout discards edits without asking.
18. **Things covering actions.** Toasts over flyout footers, a composer or a save bar.
19. **Truncation that hides the part that matters** ("can't be pl…" with no tooltip), machine names breaking mid-name.
20. **Controls that do nothing,** or go to the wrong place.
21. **The wrong action in the primary slot:** a destructive action as the filled button, a dry run styled as danger.
22. **Ids and raw keys in prose,** raw parser output as error text.
23. **Placeholders that look like values.**
24. **Charts without units,** histograms that look empty because one spike dwarfs the rest, "per 0 seconds".
25. **Two empty messages at once;** a filtered-to-nothing state with a different layout from the empty state.
26. **Jank:** a hand-off that freezes the page for seconds. Measure it (longtask entries, time to the next screenshot).
27. **Cross-page drift:** page headers, filter bars, status words and colours, row actions, flyout headers and footers, dates, numbers, empty cells, capitalisation, density, mono use, icon meanings, form titles, menus.
28. **Icon names the library doesn't have,** which render as blank boxes with no error.

## Per screenshot, quickly

- Does the first screen answer the page's question without scrolling?
- One primary action? Badge budget kept?
- Anything clipped, overlapping, wrapping badly, blank?
- Readable in dark mode (contrast, borders, charts)?
- Words: plain, sentence case, no backend terms, the glossary's words?
- Same header, filter bar, table and flyout anatomy as every other page?

## Per interaction

- Every action in the page doc's Actions section does something visible: a state change and a toast, a flyout, a navigation.
- Reload, Back and a pasted link restore the same view.
- Destructive actions confirm and name the consequence.
- A paused live page holds still; the user's own actions still show.
- Console, window errors and failed requests: none (shoot.py and browse.py print them).
