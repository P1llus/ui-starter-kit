# Brief: cross-page consistency review

You have no area. You compare every page with every other page and find drift no area reviewer can see. Read `work/briefs/qa.md` first; its setup applies (frozen build on 5300, review only). In round 2 (`verify-consistency`) the rulings in `work/rulings.md` are your checklist: mark each Applied everywhere or Drift remains (with pages); your prompt then also gives you a dev port for the error sweep, the only server you start.

## How

1. Screenshot every route in `scratch/routes.txt` in light and dark, plus one owned flyout per area and a few form flyouts: `(cd scratch && uv run python shoot.py --base http://localhost:5300 --out ../work/sessions/<task-id>/shots --routes-file routes.txt --theme both --sheet)`. Compare dark across every page on the contact sheets, and open the full-size dark shot of anything that looks off.
2. Compare side by side. Use the contact sheets and your own crops or montages for comparison (put scripts in `work/sessions/<task-id>/`), then open the full-size shots of anything that differs.
3. Grep the code for things a screenshot can't show reliably: local date or number helpers outside the formatting module, icon names the library doesn't have, inline delete icons in rows, raw hex colours.

Look for drift in: page header layout (title, description, actions, tabs), filter bars (order, search placeholders, "problems only" controls, count position), status elements (dot vs badge, the words, their colours), table density and name cells, row actions, link styles, mono use, empty states, flyout header and footer anatomy, button styles and icons, the badge budget, toast placement, date, time and number formats, capitalisation, spacing, dark surfaces, nav active states, form titles and primary button labels, menus.

## Output

Findings grouped by pattern, not page by page, in `work/sessions/<task-id>/notes.md`:

```
## <n>. <pattern>
Severity: major | minor | polish
Seen: <screenshot files>
Rule: the doc that states it, quoted; or "no rule yet"
Follows: pages that comply
Drifts: each page and how it drifts
Fix: file:line where known
Proposed rule: one line, when no doc covers it
```

End with a "No drift found" section listing what you checked that holds everywhere.

Return under 200 words: counts by severity, the patterns that need a rule, and the worst drift.
