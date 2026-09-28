# Conventions

How times, numbers, labels, statuses, tables, flyouts and links work on every page. Builders follow this file; reviewers check against it.

These are starter defaults. The orchestrator confirms or changes each one before page builders start (the spec phase), because a convention settled late means a shared fix plus an adoption pass over every page. Where a convention needs code (a formatter, a status badge), the shared module ships with it: `ui/src/lib/format/` and `ui/src/components/status/` already exist. Change a row here when a decision changes; big ones also get a row in [decisions.md](../decisions.md).

## Formatting: one module, nothing else formats

| Topic | Rule |
| --- | --- |
| Relative vs absolute time, and the cutoff | Relative under 7 days ("3 min ago", "yesterday"), then "25 Sep", year only when not this year. One column uses one form. |
| Event timestamps | "14:46:02" today, "25 Sep 14:46" before; mono only where the user compares or copies them |
| Durations and ages | "4 min", "2 h 10 min"; ages without "ago" in tables |
| Numbers | Full with separators up to 9,999, then "12.3k" only for approximate totals shown alone. Anything compared, before/after, counts in sentences, pagination totals: always full. |
| Percent, bytes, units | "41%", "1.2 GB", one unit per column |
| Empty values | A subdued dash glyph (`—`) in cells, "Not set" in key-value rows, "Never" for never run |
| Time source | Every time comes from the mock clock (`now()`, `useNow()`), never `Date.now()`, so `?freeze` works |
| Schedules | "Every 30 minutes", "Daily at 08:00" |

All of it lives in `ui/src/lib/format/`; lint blocks `toLocale*` elsewhere.

## Writing

| Topic | Rule |
| --- | --- |
| Case | Sentence case everywhere, including displayed enum values |
| Punctuation | No trailing period in cells, labels and titles; toasts and descriptions end with one |
| Meta lines | Facts joined by " · ", first word capitalised, no period |
| Verbs | "Create <noun>" makes a new object, "Add <noun>" connects something external, forms are titled "New <noun>"; "Delete" removes for good, "Remove" detaches. One wording per action across UI, audit log and assistant. |
| Page description | One statement of what the page shows ("Services owned by payments and what needs attention."), never a question |
| Sub-lines | Say what the thing is; problems go in the status column |
| Ids | Never as labels. Say "Restarted Billing", not "Restarted svc-0042". |

## Status

| Topic | Rule |
| --- | --- |
| Status elements | One status column per row, rendered by `StatusBadge`. A dot only for health (green, yellow, red) if the product has health; every other state is a badge. |
| Outcome words | One fixed set for runs, jobs and tasks: Succeeded, Failed, Running, Queued, Waiting, Cancelled, Skipped (already in `STATUS_TONES`). |
| Word to colour | Each state word maps to one tone: good, active, attention, broken, idle. Same word, same colour, every page. |
| Status sentence | At most one line above a list ("3 services need attention"), with a link that applies the filter. One component. |
| Header badges | At most two, status first |

## Tables and lists

| Topic | Rule |
| --- | --- |
| Row actions | At most one icon action plus a ⋮ menu; destructive last in danger colour; no inline delete icons |
| Name cell | Name with a stacked sub-line; mono names don't wrap, they truncate with a tooltip. Name the columns that must wrap (reasons, explanations) so a shared truncation change can't cut them. |
| Filter bar order | Search ("Search <things>") first, filters, toggles, Clear filters, count at the right. One "Problems only" control, the same everywhere. |
| New rows | A "N new · Show" row above the table, never floating over headers |
| Time range | One component, one URL parameter pair (`from`, `to`) on every page |
| Four list states | Loading, empty (says what would be here, one action), error, filtered to nothing (offers Clear filters) |

## Flyouts, forms and dialogs

| Topic | Rule |
| --- | --- |
| Flyout behaviour | Overlays the page, never pushes it (a side panel like an assistant may push). Fixed widths per kind. |
| Header | Title, at most two badges, one line of what it is, tabs with Overview first |
| Footer | Links that leave the page on the left; More, one secondary, one primary on the right. Edit is secondary unless editing is the flyout's main job. No icons on footer buttons. |
| Editing | Edit opens a form flyout, or edits in place with Save; either way, "Discard changes?" on Close, Escape and navigation |
| Destructive actions | A confirm dialog that states the consequence; type-the-name only for irreversible actions on important objects |
| Validation | Save is blocked while a field is invalid; the message says how to fix it |
| Read-only users | Actions disabled with a tooltip naming the missing permission; no banners |

## Feedback and async work

| Topic | Rule |
| --- | --- |
| Toasts | Only for what the user started. Bottom-left, away from flyout footers. 6 s, errors 30 s. |
| Long actions | Return when the work starts, show progress where the object lives; no 40-second spinners |
| Expensive or external work | Runs on request only (lookups, AI summaries, exports); cached results show their age |

## URL and navigation

| Topic | Rule |
| --- | --- |
| What lives in the URL | Tab, filters, sort, open flyout and its tab, open form, time range, view mode |
| Search validation | Route validators keep every parameter they don't know (`ui/src/lib/router`) |
| History | Typing and filters replace the entry; opening a flyout pushes one, so Back closes it |
| Cross-page links | Every parameter a link builds is read by the target page. Each page doc lists its inbound parameters. |
| In-app links | Always through the router (`AppLink`); a plain href reloads the app and resets the mock world |

## Icons and menus

| Topic | Rule |
| --- | --- |
| Icon names | Typed with the library's icon type, so a wrong name fails typecheck instead of rendering blank |
| Vocabulary | Each noun has one icon everywhere; refresh only reloads, play runs, stop stops |
| Where | No icons on header or footer buttons except download or export; no icons in menus |

## Live data

| Topic | Rule |
| --- | --- |
| What moves | Values change in place, no layout shift; new rows wait behind "N new · Show" |
| Pause | One app-wide pause that freezes views, not the world; global counters (nav badges) keep counting |
| Cadence | Each live page states how often it takes new data (5 s status pages, 30 s dashboards) |
| Live indicator | "Updated 12 s ago" with the pause toggle in the page header, on every view of a live page or none |

## Mock data coherence

| Topic | Rule |
| --- | --- |
| Source of numbers | Counts and names live in `docs/data/world.md`; page docs say "about" or link there |
| Links land somewhere | Every "Open in X" link lands on data that exists |
| Shapes | Seed data and live actions write the same shape (an audit entry from a seeded fix looks like one from a live fix) |
| Ids | Deterministic and stable across reloads, so a pasted link opens the same object |
| Speed | World built in under 300 ms; any page transition under 300 ms |

## Process

| Topic | Rule |
| --- | --- |
| Component docs | Updated in the same change that adds a prop |
| Accessibility | Icon-only buttons have a tooltip and aria-label; flyouts have an accessible name from the title |
| Widths | Checked at 1440x900 and 1280x800 |
| Sweeps | Warning sweeps on a dev server; at least one check in a second browser engine if CSS is unusual |
