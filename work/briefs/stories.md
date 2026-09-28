# Brief: demo story walkthrough

You walk the demo stories in `docs/data/world.md` end to end as the user would, in real time. Area reviewers open each state by URL with the clock frozen; you find what they can't: hand-offs between pages that break, state that gets lost, links that reload the app and reset the mock world, slow transitions, and facts that disagree from one page to the next.

Read `work/briefs/qa.md` first; its findings format and rules apply. Review only, no code edits.

## How

1. Use one live browser per story, so the mock world keeps its state and its clock:
   ```bash
   (cd scratch && uv run python browse.py start --session <task-id>-s1 --base http://localhost:5300 --route <where the user starts>)
   (cd scratch && uv run python browse.py do --session <task-id>-s1 --out ../work/sessions/<task-id>/s1 '[{"click": "..."}, {"shot": "s1-01-..."}]')
   ```
   Pass the same `--out` to every `do` and `shot` call, so the shots land in your task folder.
   Take a shot after each step, open it, decide the next step from what you see.
2. No `?freeze`. Where a story waits for a timed event, you may jump the clock with `{"advance": "90s"}`, but walk at least one story in real time.
3. Start where a real user would start (the landing page or the nav). Follow only what the UI offers. Don't type URLs unless a user would.
4. Note every place where the next step is missing, confusing, broken, slow, or leads somewhere unexpected. browse.py reports errors and full page loads between calls; a full page load in the middle of a story is a bug.
5. Check the facts across pages: a count, a status or a name shown on one page must match the next page.
6. Measure slow hand-offs: time from the click to the next useful screen. Anything over about a second is a finding.
7. Also walk the cross-page hand-offs your task lists.
8. `browse.py stop` for every session when done.

Put the story and step in every finding heading (`## Story 2 step 4 · <page>: <title>`). End the notes with a "Hand-offs that worked" list, so fixers don't break them.

Return under 200 words: counts by severity, the worst findings, and which stories walk end to end.
