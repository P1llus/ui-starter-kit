# Review and fix (step 3)

Two QA rounds, then exploration. Each kind of reviewer finds things the others can't, and no fix counts until someone else has looked at it in the running app.

## The frozen build

Reviewers look at a static build that doesn't change under them, while fixers work in the source tree on their own ports.

```bash
(cd ui && npx vite build --outDir ../work/qa-build)
(cd ui && nohup npx vite preview --outDir ../work/qa-build --port 5300 --strictPort > ../work/qa-preview.log 2>&1 &)
```

- Reviewer prompts say "review http://localhost:5300; never start a dev server; never kill the process on 5300".
- Fixer prompts say "the build on 5300 is for reviewers; never touch it".
- Refresh it only after a commit. Tell verifiers which commit it holds, and tell fixers that items marked "Not fixed" may already be fixed in the tree ("check the running dev server before fixing").
- Warning sweeps run on a dev server: a production build drops React warnings.

## Round 1: four kinds of reviewer

Launch them together, plus one fixer clearing the ORCHESTRATOR.md Open items list against the source.

| Reviewer | Brief | Finds |
| --- | --- | --- |
| Area reviewers, one per area | [qa.md](../briefs/qa.md) | Broken things, spec gaps, principle breaks, visual defects in their pages and flyouts |
| Cross-page consistency, one agent | [consistency.md](../briefs/consistency.md) | Drift no area reviewer can see: headers, filter bars, status words, row actions, dates, numbers, labels, footers. Grouped by pattern, each with a proposed rule |
| Demo stories, one agent | [stories.md](../briefs/stories.md) | Broken hand-offs between pages, lost state, full reloads that reset the world, jank, facts that disagree across pages |
| Intent coverage, one agent (if the user brought design material) | [intent.md](../briefs/intent.md) | Every "Keep" item from the intake notes: absorbed (in docs AND visible in the app), dropped on purpose (recorded), or missing, with add or drop recommended |

Why all four: area reviewers open each state by URL in a fresh page with the clock frozen, so they can't see what breaks between pages or over time. In the reference run the story walker, working in one live browser without `?freeze`, found both blockers of the round: a draft lost on a tab switch, and a link that reloaded the app and wiped the mock world. Six area reviewers had missed or underrated them.

Seed every reviewer prompt with "Known already (confirm, don't re-investigate)" items from Open items, so reviewers spend their time on new problems. Pass your own hunches as questions, not facts ("I think the histogram is empty before 14:00; confirm and find the cause"). In the reference run one such hunch was wrong, and the reviewer found the real cause.

## Task ids

Fix and verify briefs read other tasks' notes by path, so these ids are fixed. Use them exactly (add a number for a second round: `qa-billing-2`).

| Task id | Writes |
| --- | --- |
| `qa-<area>` | `work/sessions/qa-<area>/notes.md`: area findings |
| `qa-consistency` | `work/sessions/qa-consistency/notes.md`: patterns, each with a proposed rule |
| `qa-stories` | `work/sessions/qa-stories/notes.md`: story findings, hand-offs that worked |
| `qa-intent` | `work/sessions/qa-intent/notes.md`: coverage table and recommendations |
| `fix-shared` | `work/sessions/fix-shared/notes.md`: shared APIs to adopt |
| `fix-<area>`, `fix-leftovers` | their return messages |
| `verify-<areas>`, `verify-consistency` | `work/sessions/<id>/notes.md`: status tables, new findings, drift, sweep results |

## Findings format

From qa.md. Every finding cites a screenshot the reviewer opened:

```
## <route or flyout>: <short title>
Severity: blocker | major | minor | polish
Seen: <screenshot file names>
Problem: one or two sentences.
Fix: what should change, concretely (component or file if known).
```

- "A finding you didn't see in a screenshot or in the running app is a guess; don't report guesses."
- "No findings about taste you can't tie to a principle, the page doc or a clear usability problem."
- "If the doc is wrong and the UI is right, say 'doc fix'."
- Order by severity. Return counts by severity and the three worst.

## Rulings

The consistency reviewer proposes rules. You make them final in `work/rulings.md`. It is tracked, so checkpoint commits keep it, and deleting `work/sessions/` can't lose it.

1. One line per ruling: an id (M1 to Mn for major, m1 to mn for minor, p1 to pn for polish), the rule, the pattern number in `work/sessions/qa-consistency/notes.md` (its Drifts line lists the pages), and the doc that must record it.
2. A ruling is a decision, not a suggestion. Where it contradicts a page doc, the ruling wins and the page doc changes.
3. Settle doc-versus-doc conflicts the same way.
4. Decision rows stay yours: when a ruling changes a row in `docs/decisions.md` or needs a new one, write it as you rule. Fixers record rulings only in the docs they name.

Your calls on the intent coverage recommendations go in the same file, under "Intent decisions": one line per item, add (with the owning area), drop (with the reason) or doc fix.

Rulings short enough to fit in Open items can go there ("Ruling: a sub-line says what the thing is; the problem goes in the status column. Apply on Tasks and any list doing the same; update tasks.md and list-table.md").

## Fix order: shared first

1. **One shared fixer** builds every shared piece the rulings need (the formatting module, row actions, status helpers, filter bar order, header and footer anatomy, style overrides that pages copied or that fight the theme, moved into a shared component or `ui/src/theme/`), records each ruling in the doc it names (usually `docs/design/conventions.md` or a component doc), and keeps old props working. It also does sweeps that only make sense once: migrating every local date helper to the formatting module, fixing a link bug everywhere. It returns "shared APIs to adopt", one line each. Commit.
2. **Area fixers**, one per area ([fix.md](../briefs/fix.md)), in parallel. Inputs in order: their area's notes, the rulings and intent decisions in `work/rulings.md`, the story findings for their area, "Read work/sessions/fix-shared/notes.md for the shared APIs to adopt". Blockers first, with the root cause if a reviewer found it. Rules: fix everything in the area, polish included; a finding you disagree with gets fixed or the doc changes, and the return says why; findings outside your area go in the return, not into someone else's files.
3. Cross-area leftovers from fixer returns go to Open items, and one leftovers fixer clears them.

Fix prompt template:

```
Task id: fix-<area>. Repo: <path>. Read work/briefs/fix.md and follow it. Dev server port: 52NN (--strictPort).
Read work/sessions/fix-shared/notes.md for the shared APIs to adopt.
Your area: <pages, flyouts, builders>. You own: <paths, including page docs and the mock parts for the area>.
Findings: work/sessions/qa-<area>/notes.md; rulings M1..; story findings: <the blocker first, with its root cause>;
intent decisions <group>. Known: <items already diagnosed>.
```

## Round 2: verify, don't trust

Fixers overclaim. In the reference run area fixers reported every ruling "applied on every page in my area"; an independent check found 15 of 20 rulings still drifting somewhere. So:

1. Commit, rebuild, refresh the frozen build.
2. **Verifiers** ([verify.md](../briefs/verify.md)), one per group of areas: every round 1 finding gets Fixed, Not fixed, Changed differently (fine if the doc now says so) or Regressed, seen in a screenshot. Then a regression pass over every page in the area, and NEW findings in the usual format. Watch for regressions from shared changes.
3. **Consistency re-check** (`verify-consistency`, [consistency.md](../briefs/consistency.md) with the rulings as the checklist): every ruling across every route, Applied everywhere or Drift remains (with pages), plus a code grep for what the rulings forbid (local formatters, inline delete icons, unknown icon names).
4. **Error sweep** on a dev server, run by the same agent with its own dev port (the only reviewer allowed one): `shoot.py --warnings` over `routes.txt`, detail routes and one flyout per kind. Report every console error, React warning, failed request and mid-flow reload.
5. Rule on open questions the re-check raises, and add the new rulings to `work/rulings.md`.
6. **Final fix wave**, areas merged into two or three agents, with one owner per shared area ("shared table and flyout code is yours for ruling changes; others only adopt"). The brief says: "If you disagree with a ruling, apply it anyway and say why." Commit.

Grep-able rules (import the one formatter, type icon names) stick after one round. Judgement rules (footer layout, status words, label casing) usually need the second round with the drift listed per page.

## Dark mode and widths

Step 2 set the dark-mode policy in `qa.md`. Check it before QA and change it if the project needs another one. Shooting both themes is cheap; reading them is not. The reference reviewers shot everything twice but opened only 10 to 40 dark screenshots out of hundreds. Either require a dark contact sheet per area, read in full, or say that dark is sampled and have the consistency reviewer check it across all pages. Check key pages at 1280x800 as well as 1440x900: most wrapping and clipping bugs show at the narrower width.

## When is QA done

- No blocker, major or minor finding open; polish either fixed or recorded as a decision to leave it.
- Every ruling applied everywhere.
- The error sweep reports nothing.
- Every demo story walks end to end in a live browser.
