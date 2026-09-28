# UX principles

These rules apply to every page, flyout and form. When a design and a rule disagree, the rule wins unless [decisions.md](../decisions.md) records an exception.

<!-- Starter set from the UI starter kit. Step 2 adapts the examples to the product; keep the rules unless the user decided otherwise. -->

## 1. One question per page

Every page answers one question, and its first screen answers it without scrolling or clicking. The page doc names that question under "Question". The page description in the UI (one line under the title) states what the page shows; it is not the question. If a page needs a second question answered, that is a tab, a flyout or another page.

## 2. Progressive disclosure: row, flyout, page

- A table row identifies a thing and shows its state. Nothing more.
- A flyout explains one thing: what it is, whether it's OK, what it relates to, what you can do.
- A full page exists only when a noun needs a canvas: an editor, a detail page with several tabs, a builder with a live preview.

Detail belongs one level down. When in doubt, move it down.

## 3. Colour means state

Colour is for health, severity and run state. Everything else is neutral text. The badge set is small and fixed (`StatusBadge`, documented in `components/status.md` once the spec phase writes it).

| Place | Max |
| --- | --- |
| Table row | one status element plus one severity or risk value |
| Flyout or page header | two badges |
| Card or list item | one badge |

Kinds, types, counts and tags are plain text or a column, never a badge.

## 4. Numbers earn their place

Show a number only when someone would act on it or compare it. No rows of KPI tiles repeating what the table below says. Overview pages may have up to four summary tiles; list pages get one status sentence at most ("3 services need attention").

## 5. Explain, don't just list

Where the system applies hidden logic (inheritance, precedence, scheduling, matching), show the result and the reason, then the fix: what is wrong, why, and at most two actions. Plain words beat internal names. Never show endpoint paths, request bodies, internal ids or field names as labels. Machine values the user may copy (names, ids, addresses, queries) appear in mono.

## 6. Actions

- One primary action per page and per flyout. Secondary actions next to it; the rest in a "More" menu.
- Destructive actions confirm and state the consequence. Type-the-name confirmation only for irreversible actions on important objects.
- Writes with a wide effect show what they will do before they run, and report what happened after.
- Expensive or external work runs on request only; a cached result shows its age. Nothing calls an external service because a page rendered.

## 7. Links keep context

Clicking a related object opens it in a flyout. The page behind stays as it was: query, filters, scroll, selection. Navigation away happens through explicit "Open page" links and the nav. Flyouts overlay the page; they never push or squish it.

## 8. State lives in the URL

Tab, filters, open flyout, form and view mode are URL params. Reload, Back and a pasted link restore the same view.

## 9. Every list has four states

Loading, empty, error and filtered-to-nothing. Empty says what the list would hold and offers one action. Filtered-to-nothing offers "Clear filters".

## 10. Live data stays calm

Live values change in place without layout shift. New rows in a list the user is reading don't push content down: show "12 new · Show" and let the user pull them in. Auto-refresh is visible and one app-wide switch pauses it.

## 11. Writing

Sentence case everywhere. Short labels. Buttons are verbs. Descriptions are one line. No marketing words, no exclamation marks, the glossary's terms only.
