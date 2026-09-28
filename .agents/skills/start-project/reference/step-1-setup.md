# Step 1: setup

Goal: a working toolchain, the user's material collected and understood, the first round of answers, research done or queued, the project files in place, and an ORCHESTRATOR.md that starts step 2 in a fresh session. You talk to the user in this step; keep them posted in short lines.

Work through the sections in order. Every command block starts at the repo root. Write answers down as you get them: the files are what survives this session.

## 1. Orient

1. Read `README.md` and `docs/README.md`.
2. Check git: `git log --oneline | head`, `git remote -v`.
   - If the history is the starter kit's own (commits about the kit, or a remote named like `ui-starter-kit`), the project should not carry it. Ask the user (AskUserQuestion) whether to reset: `rm -rf .git && git init -b main`. Deleting `.git` can't be undone, so never do it without a yes.
   - Ask whether the project gets a remote, and whether agents may push to it. Default: commit locally, never push.
3. Create the brief you will write into from now on (`docs/decisions.md` already ships with the kit):

```bash
mkdir -p docs/product docs/research work/intake/notes work/sessions/setup
cp .agents/skills/start-project/templates/docs/product-brief.md docs/product/brief.md
```

## 2. Environment

```bash
(cd scratch && uv sync && uv run python doctor.py)   # node, npm, uv, Chromium, headroom, orphan servers
```

- Project-local installs go ahead without asking: `npm install` in `ui/`, `uv sync` in `scratch/`, Playwright's Chromium into its own cache (`(cd scratch && uv run playwright install chromium)`, about 150 MB, only if `doctor.py` found no Chromium).
- System-wide installs need the user's yes: uv itself, a newer Node, system packages. Put everything missing into one list with the exact command for each, show it once, and ask: "run these yourself, or shall I?" Don't ask item by item.
- Offer a local clone of the component library's source, which makes agents much faster than web search or remote docs: `git clone --depth 1 --branch v<version> https://github.com/elastic/eui <path>`, with the version installed in `ui/node_modules/@elastic/eui/package.json`, because `main` runs ahead of releases; an existing clone on `main` is fine too (about 1 GB; the docs are in `packages/website/docs`, components in `packages/eui/src/components`). Ask where the user keeps clones, and whether they have others worth grepping (a library, a spec, an API repo). Record the paths for AGENTS.md. Agents grep local clones instead of using MCP servers or remote docs for the same library.
- Node older than 24: the kit expects nvm (`source "$NVM_DIR/nvm.sh" && nvm install 24 && nvm alias default 24`; `ui/.nvmrc` says 24). Your shell doesn't load nvm and `nvm use` lasts one command, so until the next session prefix node commands with `source "$NVM_DIR/nvm.sh" && nvm use 24 >/dev/null &&`. Without nvm, use the user's other manager (fnm, volta, mise, proto) or a system Node 24+. If `which node` points at another manager's shim, check that it resolves to Node 24 too (`node --version` in `ui/`).

Then install and verify:

```bash
(cd ui && npm install && npm run check && npm run build)   # typecheck, lint, format, build
(cd ui && npm run tokens)                                   # design/tokens.css from the installed theme
(cd ui && nohup npm run dev -- --port 5190 --strictPort > ../work/sessions/setup/dev.log 2>&1 &)
for i in $(seq 60); do curl -sf http://localhost:5190/ > /dev/null && break; sleep 1; done
(cd scratch && uv run python shoot.py --base http://localhost:5190 --out ../work/sessions/setup \
  --theme both --freeze / "/?flyout=service:svc-billing" /dev/smoke /dev/mock)
kill $(lsof -ti tcp:5190 -sTCP:LISTEN 2>/dev/null || ss -ltnp | grep ':5190 ' | grep -o 'pid=[0-9]*' | cut -d= -f2)
```

Open the PNGs with Read. You should see the sample Home page, a service flyout, the smoke page and the mock page, in light and dark, and the run should print no errors.

## 3. Component library and stack

The kit ships with EUI (Borealis theme) because it covers dense data apps well and has a real token set. Ask the user whether that fits, and which libraries they already know they want (charts, node graphs, code editors, maps).

- EUI stays: nothing to change.
- Another library: swap it now, before any design work. Keep the patterns the method depends on: URL state helpers (`ui/src/lib/url`), the flyout host driven by `?flyout=`, the dev hooks (`ui/src/app/devHooks.ts`), `?theme=`, the mock core. Replace `ui/scripts/export-tokens.mjs` with an export of the new library's tokens, update `docs/tech/frontend.md` and rows UI-1 and UI-2 of `docs/decisions.md`, rerun section 2, and look at the screenshots again.

## 4. Collect and read the user's material

The user may have brought material in any form: files in `input/`, files dropped in the repo root, paths elsewhere on the machine, PDFs, text, markdown, images, HTML exports, links, claude.ai artifacts, or text pasted into the chat that started this session. No material at all is fine too; skip to section 5 and say so in ORCHESTRATOR.md later.

1. **Collect.** Ask where everything is if the user hasn't said. Gather it into `input/` (gitignored):
   - Repo root: the kit's own entries are `.agents`, `.claude`, `.git`, `.gitignore`, `CLAUDE.md`, `README.md`, `design`, `docs`, `input`, `scratch`, `ui` and `work`. Anything else there is the user's. List it and ask before you move it into `input/`.
   - Elsewhere on the machine: copy the files. Don't delete originals outside the repo.
   - Images pasted into the chat exist only in this session's context. Ask for their file paths and copy the files.
   - Text pasted into the chat: save it to `input/from-chat.md`.
   - claude.ai artifacts: read them with the Artifact tool if you have it, and write each page to `input/artifacts/<name>.html` so `render_boards.py` renders it with the rest.
   - Web links: fetch the ones whose content matters (a spec, a docs page) into `input/links/<slug>.md`. List the rest in `input/from-chat.md`.
   - Delete copy junk you come across (`*:Zone.Identifier`, `.DS_Store`).
2. **Make it readable.** Agents read text and PDFs directly and look at images with the Read tool. HTML design exports and mockups get rendered to PNG, one per board, with a gallery page:
   ```bash
   (cd scratch && uv run python render_boards.py ../input --out ../work/intake/renders --sheet)
   ```
   It lists blank renders; rerender those with a longer `--wait` or read the source HTML before anyone relies on them. Anything else (an unusual export format, a zip, a spreadsheet) gets a small script in `work/sessions/setup/` when you actually need one. It writes its output to `work/intake/text/`, which is gitignored like `input/`.
3. **Inventory.** Write `work/intake/inventory.md`: each item, its kind, where it came from, what it covers, how far to trust it.
4. **Read and look.** Read every text document, or its summary sections if it's long. Look at a handful of renders and images yourself to calibrate: what style the user is going for, how consistent it is, how much is AI-generated clutter.
5. **Intake notes** in the format of [work/briefs/intake.md](../../../../work/briefs/intake.md): `work/intake/notes/<group>.md` with a Summary (max 500 words) and one entry per board or screen (Intent, Keep, Drop or fix, Data needed, Actions).
   - Small input (under about 15 boards and a few docs): write them yourself.
   - Larger input: delegate intake reviewers in parallel, one per group of related boards (grouped by job, not by file), pointing each at that brief, its renders and its images. Read only the Summaries.

Treat the material as intent, not truth. Earlier AI design rounds tend to produce inconsistent styling, too many badges and numbers, pages missing from the nav, flyouts that crush the page, and backend words in the copy. Keep the ideas, drop the clutter.

## 5. First questions

Use [questions.md](questions.md), round 1. Ask only what the material doesn't answer. AskUserQuestion for choices (2 to 4 options, your recommendation first), plain questions for descriptions. A few questions at a time.

Product facts go into `docs/product/brief.md`, decisions into `docs/decisions.md`, as you get them.

## 6. Research

Start research agents as soon as you know what to research; they run while you keep asking. Point each at [work/briefs/research.md](../../../../work/briefs/research.md) with its topic and questions. Typical topics:

- The systems the product shows or controls (an API, a database, a protocol, a SaaS tool): objects, states, names, volumes, error cases. The point is believable mock data and copy, not an integration plan.
- The domain: the users' terms, their jobs, what a good tool for that job shows first.
- The component library: which components fit the patterns the user wants, from the local clone if there is one.

Each writes `docs/research/<topic>.md`, under 150 lines, "What the UI needs from this" at the top. Read them as they land and turn surprises into questions for step 2.

## 7. Create the project files

| File | From | Fill in now |
| --- | --- | --- |
| `AGENTS.md` | `.agents/skills/start-project/templates/AGENTS.md` | Product line, stack, local clones, tools. Mark what you can't fill yet `TODO(step 2)`. |
| `CLAUDE.md` | replace the kit's version with one line: `@AGENTS.md` | |
| `ORCHESTRATOR.md` | `.agents/skills/start-project/templates/ORCHESTRATOR.discovery.md` | Mission so far, what the user brought, answers so far, open questions for step 2, research done or still to run, the log. |
| `docs/product/brief.md` | created in section 1 | Everything known so far. |
| `docs/decisions.md`, `docs/README.md` | ship with the kit | Adjust to the decisions made; link the product and research docs you wrote. |

Replace the kit's `README.md` with a short project README (what it is, how to run the UI, where the docs are). Keep `input/README.md` only if it still helps.

Check links: `(cd scratch && uv run python check_links.py --allow-missing)`. Links to docs later steps write are listed, not failed; anything else it reports is a real break.

## 8. Commit and stop

1. Wait for every research and intake agent to return. If one is still running when you're otherwise done, stop it and list its topic under "Open questions for step 2" in ORCHESTRATOR.md: background agents end with this session.
2. Kill every dev server and browser you started (by PID from `lsof -ti tcp:<port> -sTCP:LISTEN` or `ss -ltnp`; `browse.py stop` for browse sessions).
3. Commit: "Set up <project> from the UI starter kit". Push only if the user allowed it.
4. Tell the user, in a few lines: what is set up, anything from the install list still pending, what you learned, what step 2 will ask about, and how to continue:

> Start a new Claude Code session in this folder on at least Opus 5.5 at xhigh effort (or Fable 5.1 at high), and say: **Read ORCHESTRATOR.md and follow it.** Step 2 continues our conversation, writes the project brief and page list for you to confirm, and makes design boards for your approval.

Then stop. Don't start step 2 in this session, even if context remains: step 2 needs a clean start and the user's attention.
