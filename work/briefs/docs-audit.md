# Brief: docs audit

You make the docs true, short and linked. You own `docs/**` and nothing else; a builder may be fixing the UI beside you, so re-read a doc right before editing it. Load the `unslop` skill (`.agents/skills/unslop/`).

## Do

1. `(cd scratch && uv run python check_links.py)` and fix every broken link and anchor.
2. Remove every dependence on material that won't stay: `input/`, `work/intake/`, `work/sessions/`, `work/rulings.md`, the design boards as a spec. Restate the needed fact in place.
3. Check the docs against the code:
   - `docs/pages/README.md` against `ui/src/routes/`: every page exists, nothing exists that isn't listed.
   - `docs/ux/navigation.md` against the side nav and the URL params pages actually read.
   - `docs/ux/flyouts.md` against `ui/src/app/flyouts.ts`.
   - Component docs against their props (spot-check the most used).
   - `docs/data/world.md` counts against `/dev/mock` (screenshot it).
4. `docs/decisions.md`: one row per topic, no contradictions between rows or with other docs, ids in order.
5. Prune: history notes ("changed in round 2"), version notes, filler, duplicated content (link instead). Files under about 150 lines; split any over 250.
6. Anything the UI does that a doc says otherwise, where you can't tell which is right: list it in your return; don't guess.

Return under 150 words: links checked and fixed, docs changed, mismatches you could not settle (for the orchestrator or the sweep agent).
