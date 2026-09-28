# Screenshots and looking

Agents can't see the app unless they take a screenshot and open it. The tools in `scratch/` make that fast enough to do hundreds of times per agent: the reference reviewers opened 150 to 750 screenshots each, and that looking is where the findings came from.

## The rule

**A page you have not looked at is not done. A finding you did not see is a guess.**

- Open every screenshot you judge with the Read tool, at full size.
- Cite the file names you looked at in every finding and every "done" claim.
- Scripts may drive the browser, read text and URLs, and assert things. That backs up the looking; it never replaces it. A DOM check proves an element exists, not that it's visible, readable, aligned or sensible.
- Contact sheets (`--sheet`) are for overview and for comparing pages side by side. Open the full-size PNG before you report anything you saw on a sheet.
- Check light and dark, at 1440x900, and key pages at 1280x800 (most wrapping and clipping shows at the narrower width).
- The orchestrator can check after the fact: `sessions.py agents` shows how many PNGs each agent opened.

## Which tool

| Need | Tool |
| --- | --- |
| Shots of routes and states reachable by URL | `shoot.py <routes>` |
| A sequence: click, type, check, shoot, in one page session | `shoot.py --flows flows.json` |
| A sweep of every route for errors | `shoot.py --routes-file routes.txt --warnings` |
| Walking a story step by step, deciding each step after looking | `browse.py` (one live browser across calls) |
| Design canvases or exported mockups to PNG | `render_boards.py` |
| Before/after of a fix | `shoot.py ... --compare <old dir>` |

All of them print console errors, uncaught exceptions, window errors (ResizeObserver loops only show there), failed requests, HTTP errors, the Vite overlay text, and full page loads in the middle of a flow. Exit code 1 means something was reported: read the output, not only the PNGs.

## shoot.py

```bash
(cd scratch && uv run python shoot.py --base http://localhost:52NN --out ../work/sessions/<task>/shots \
  --theme both --freeze-at 15:00 / "/?tab=activity" "/?flyout=service:svc-billing")
```

- `--theme both` shoots each state in light, flips the theme on the same state and shoots dark (`<name>-dark.png`).
- `--freeze` adds `?freeze` so times and live values hold still; `--freeze-at 15:00` also pins "now" to 15:00 today, the time page doc sketches assume. Leave both off to check live behaviour.
- `--sizes 1440x900,1280x800` repeats every shot per size (`<name>@1280x800.png`).
- `--routes-file ../scratch/routes.txt`, `--warnings`, `--jobs 4`, `--sheet`, `--compare <dir>`, `--devlog <vite log>`, `--warmup`, `--scale 2` (for reading small text).
- Output also has `index.md` (file, flow, URL) and `.FAILED.png` for flows that stopped.

Flows run steps in one page session, so state survives:

```json
[{"name": "restart-billing", "route": "/?flyout=service:svc-billing",
  "steps": [
    {"shot": "billing-before"},
    {"click": "@restartService"},
    {"expect": {"text": "Restarted Billing"}},
    {"shot": "billing-after", "selector": "@flyout-service"}
  ]}]
```

Steps: `click`, `dblclick`, `fill`, `type`, `press`, `hover`, `select`, `check`, `uncheck`, `scroll`, `nav` (client-side, keeps the world), `goto` (full load, resets it), `back`, `forward`, `wait`, `wait_for`, `expect`, `advance` (mock clock), `theme`, `eval`, `text`, `shot`. The full list with options is in `scratch/uitools/steps.py`. A failed step stops the flow, saves the state as `.FAILED.png` and prints visible elements that look like what you meant, with ready-to-use selectors.

After every action the tools wait until no request is in flight and the page has stopped changing, so a flyout whose code loads on first use is there when you shoot. Use `wait_for` for things that appear on a timer (a story beat, a toast after slow work), and prefer it and `expect` over `wait`. Prefer `@test-subj` selectors over text. Prefer URLs over clicks.

## browse.py

For story walkthroughs and exploration: one headless browser that stays open, so the mock world and its clock carry on between your calls. You take a shot, look at it, decide the next step.

```bash
(cd scratch && uv run python browse.py start --session <task-id> --base http://localhost:5300)
(cd scratch && uv run python browse.py do --session <task-id> '[{"click": "@open-svc-billing"}, {"shot": "03-billing"}]')
(cd scratch && uv run python browse.py shot --session <task-id> 04-after --selector @flyout-service)
(cd scratch && uv run python browse.py stop --session <task-id>)
```

Each call reports errors since the previous call and whether the page did a full load in between (a reset world is a bug worth reporting). Shots land in `work/sessions/<session>/browse/`; pass `--out ../work/sessions/<task-id>/<folder>` to `do` and `shot` when you run several sessions for one task.

## Servers

- Your own port, `--strictPort`, a log file in your session folder:

```bash
mkdir -p work/sessions/<task>
(cd ui && nohup npm run dev -- --port 52NN --strictPort > ../work/sessions/<task>/dev.log 2>&1 &)
for i in $(seq 60); do curl -sf http://localhost:52NN/ > /dev/null && break; sleep 1; done
```

- Kill it by PID when done: `kill $(lsof -ti tcp:52NN -sTCP:LISTEN)` (macOS and Linux with lsof) or `kill $(ss -ltnp | grep ':52NN ' | grep -o 'pid=[0-9]*' | cut -d= -f2)` (Linux).
- Other agents' edits reload dev servers and reset the mock world. For long flows use a private build: `(cd ui && npx vite build --outDir ../work/sessions/<task>/dist)`, then `(cd ui && nohup npx vite preview --outDir ../work/sessions/<task>/dist --port 52NN --strictPort > ../work/sessions/<task>/preview.log 2>&1 &)` and the wait loop above. shoot.py retries a flow once when a reload hits it mid-flow and says so.
- Reviewers use the frozen build on 5300 and never start or kill servers.
- Warning sweeps run on a dev server; a production build hides React warnings.

## Housekeeping

- Shots and scripts go in `work/sessions/<task-id>/`. Never in `scratch/` (shared tools only), never named after a Python standard library module.
- Name shots after what they show (`billing-after-restart`), not `shot1`.
- A tool bug, or a feature you needed more than once: add `Tool bug: ...` or `Tool request: ...` to your return message, and the orchestrator improves the tool. One-off needs get a small script in your session folder.
