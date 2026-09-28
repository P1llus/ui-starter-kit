# Brief: final polish and full sweep

You are the last builder before wrap-up. Read `work/briefs/build.md` and `work/briefs/pages.md`; everything there applies, but your ownership is the whole of `ui/` for fixes (re-read files before editing: the docs audit runs beside you on `docs/`).

## Do

1. Fix every unchecked item in ORCHESTRATOR.md "Open items" and tick each with a few words on the fix.
2. Sweep on a dev server on your port (a production build hides React warnings):
   ```bash
   (cd scratch && uv run python shoot.py --base http://localhost:<port> --out ../work/sessions/<task-id>/sweep \
     --routes-file routes.txt --theme both --warnings --jobs 4 --sheet)
   ```
   plus the detail routes (one of each detail page, every builder in edit mode, every tab) and one owned flyout per kind in `docs/ux/flyouts.md`, opened by URL. Add any missing route to `scratch/routes.txt`.
3. Fix every console error, React warning, failed request and mid-flow reload the sweep reports.
4. Look at the shots: contact sheets for overview, then full size for anything that looks off. Fix clipping, overlap, blank areas, unreadable dark mode, broken wrapping at 1280x800.
5. Walk each demo story once with `browse.py` and fix anything that breaks.
6. `npm run check` and `npm run build` pass for the whole tree.

Return under 200 words: open items ticked, sweep counts (routes, flyouts, errors before and after), other issues found and fixed, anything left and why.
