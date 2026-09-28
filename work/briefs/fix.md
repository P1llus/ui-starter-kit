# Brief: fixing review findings

Read `work/briefs/build.md` and `work/briefs/pages.md`; everything there applies. You own one area and fix every finding for it from these sources, in severity order, and leave nothing open:

1. Your area reviewer's notes: `work/sessions/qa-<area>/notes.md`.
2. The consistency rulings: `work/rulings.md` (final). Each names its pattern in `work/sessions/qa-consistency/notes.md`, whose Drifts line lists the pages. The shared pieces those rulings need were built by the shared fixer; its notes list the APIs to adopt (`work/sessions/fix-shared/notes.md`). Adopt them in your pages and flyouts so your area follows every ruling.
3. The story findings for your area: `work/sessions/qa-stories/notes.md`.
4. The intent coverage results for your area, if that review ran: the "Intent decisions" section of `work/rulings.md`.
5. Unchecked items for your area in ORCHESTRATOR.md "Open items".

Rules:
- Blockers first. Where a reviewer found the root cause, start there, but confirm it: a stated cause can be wrong.
- A finding you disagree with: don't silently skip it. Fix it, or change the doc so doc and UI agree, and say why in your return message. A ruling you disagree with: apply it anyway and say why.
- A finding outside your area that you notice: list it in your return; don't fix it.
- Keep the page docs true for what you change.
- The frozen build on port 5300 is for reviewers; never touch that process. It may be older than the tree: check the running dev server before fixing something marked "Not fixed".
- Verify every fix with a screenshot or a flow (`expect` the result), light and dark where visual. Before/after: `shoot.py --compare <before dir>`.

Return under 200 words: counts fixed per source, anything you changed a doc for instead (and why), anything left and why, shared files touched.
