# Brief: verifying fixes

You check, in the running app, that every finding from the previous round is fixed, and you look for what the fixes broke. Fixers report "all done"; in the reference run an independent check found 15 of 20 rulings still drifting. Your job is to not take their word for it. Read `work/briefs/qa.md` first; its method and format apply (frozen build on 5300, which now holds the FIXED build at the commit your prompt names; review only).

## How

1. For every original finding in your areas (the notes files your task names): look at it in the running build, screenshot it, open the shot, and mark it:
   - **Fixed**
   - **Not fixed**
   - **Changed differently** (fine if the doc now says so)
   - **Regressed**
2. Then a regression pass over every page, tab and owned flyout in your areas, light and dark, looking for anything the fixes broke, especially from shared changes (formatting, row actions, headers, footers, toasts).
3. Re-walk any blocker's story end to end with `browse.py`.
4. Read the error lines shoot.py and browse.py print for the frozen build (console errors, window errors, failed requests, reloads) and report them. React warnings only show on a dev server; the separate error sweep covers those.

You may split a large scope across subagents (one per area); you stay responsible for the merged result and re-check blockers yourself.

## Output

`work/sessions/<task-id>/notes.md`: first a table of every original finding with its status (one line each), then NEW findings in the qa.md format.

Return under 150 words: counts per status, and every Not fixed, Regressed and new blocker or major in one line each.
