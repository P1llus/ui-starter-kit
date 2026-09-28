# Brief: intent coverage review

You check that nothing worth keeping from the user's input material vanished by accident. The intake notes (`work/intake/notes/*.md`) list, per board, what to Keep. Every Keep item must now be built, or dropped on purpose. Read `work/briefs/qa.md` first; its setup applies (frozen build on 5300, review only, look at screenshots).

## How

1. Split every Keep bullet and every "Top ideas worth keeping" item into atomic items (one idea each). Number them per group: A1, A2, ... B1.
2. For each item, find it:
   - in the docs (page, component or feature docs, `docs/decisions.md`, the "Not pages" table, each page doc's "Out of scope"), and
   - in the running app: screenshot it and open the shot. Reading `ui/src` is not evidence that something is visible.
3. Classify each item:
   - **Absorbed**: in the docs AND seen in the app.
   - **Dropped on purpose**: named in "Out of scope", "Not pages" or a decision row.
   - **Missing**: say which: not in docs or app, in docs but not built (build gap), built but not documented (doc gap), or replaced by something else without a record.
4. For each Missing item, recommend **add** (it clearly helps a user do their job, judged against `docs/ux/principles.md`), **drop** (record why), or **doc fix**. Be selective: the input material was cluttered, and most of what is missing was probably cut for a reason.

For a large input, split the groups across subagents (one per intake notes file); you merge their tables and own the result.

## Output

`work/sessions/<task-id>/notes.md`: first a table per group (item, class, where it is, screenshot), then a "Recommendations" section with one line per Missing item (add, drop or doc fix, and which area owns it). The orchestrator records its decisions in `work/rulings.md`, where fixers read them.

Return under 150 words: counts per class per group, and the recommended additions in one line each.
