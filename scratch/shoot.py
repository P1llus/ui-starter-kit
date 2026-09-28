"""Screenshot routes and scripted flows of the running app, and report every error it logs.

Run from scratch/ against a dev server or a frozen preview build:

    uv run python shoot.py --base http://localhost:5199 --out ../work/sessions/<task>/shots \\
        --theme both --freeze-at 15:00 / "/?tab=activity" "/?flyout=service:svc-billing"

    uv run python shoot.py --base ... --out ... --flows flows.json --theme both --sheet
    uv run python shoot.py --base ... --out ... --routes-file routes.txt --warnings --jobs 4

Plain routes are paths with an optional query; quote them when they contain ? or &. Most
states should be reachable by URL (tabs, flyouts, filters live in the URL), so most shots
need no clicks at all.

Flows (--flows, JSON list) run several steps in ONE page session, so state survives:

    [{"name": "restart-billing", "route": "/?flyout=service:svc-billing",
      "steps": [{"shot": "billing-before"},
                {"click": "@restartService"},
                {"expect": {"text": "Restarted Billing"}},
                {"shot": "billing-after"}]}]

Steps: click, dblclick, fill, type, press, hover, select, check, uncheck, scroll, nav
(client-side, keeps the mock world), goto (full load, resets it), back, forward, wait, wait_for,
expect, advance (jump the mock clock), theme, eval, text, shot. Options and conditions are
documented in uitools/steps.py; how to use the tools well is in docs/tech/screenshots.md. "@name" is short for [data-test-subj="name"].
The old actions format ({"route", "name", "clicks": [...]}) still works.

Output: <out>/<name>[@WxH][-dark].png, tall full-page shots split into .1/.2 tiles, a failed
flow saves <flow>.FAILED.png, and <out>/index.md lists every file with its URL. For each shot it
prints console errors (and warnings with --warnings), uncaught exceptions, window errors,
failed requests, HTTP >= 400, the Vite overlay, and full page loads in the middle of a flow.
Exit code 1 if anything was reported, a check failed or a step failed: read the output, not
just the PNGs. Then open every PNG you are asked to judge with the Read tool.

Other options: --sizes 1440x900,1280x800 (viewport matrix), --sheet (contact sheets for
overview), --compare <dir> (before/after diffs), --devlog <vite log> (new log lines per shot),
--warmup (load each route once first, so Vite's dependency optimizer settles), --jobs N.
"""

from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import sys
from dataclasses import dataclass, field
from pathlib import Path

from playwright.sync_api import sync_playwright

from uitools.capture import Capture, format_lines, settle
from uitools.chrome import launch
from uitools.images import contact_sheets, diff
from uitools.steps import Flow, build_url, slug


@dataclass
class Job:
    name: str
    route: str
    steps: list[dict] = field(default_factory=list)


def load_jobs(args) -> list[Job]:
    jobs = [Job(slug(r), r, [{"shot": slug(r)}]) for r in args.routes]
    if args.routes_file:
        for line in Path(args.routes_file).read_text().splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                jobs.append(Job(slug(line), line, [{"shot": slug(line)}]))
    for path in args.flows or []:
        for entry in json.loads(Path(path).read_text()):
            name = entry.get("name") or slug(entry.get("route", "/"))
            if "steps" in entry:
                steps = list(entry["steps"])
            else:  # old actions format
                steps = [{"click": c} for c in entry.get("clicks", [])]
                if entry.get("wait_ms"):
                    steps.append({"wait": entry["wait_ms"]})
            if not any("shot" in s for s in steps):
                steps.append({"shot": name})
            jobs.append(Job(name, entry.get("route", "/"), steps))
    # `?sort=x` and `?sort=-x` slug the same; number repeats so neither shot overwrites the other.
    seen: dict[str, int] = {}
    for job in jobs:
        n = seen[job.name] = seen.get(job.name, 0) + 1
        if n > 1:
            job.steps = [{**s, "shot": f"{s['shot']}-{n}"} if s.get("shot") == job.name else s for s in job.steps]
            job.name = f"{job.name}-{n}"
    return jobs


def parse_sizes(args) -> list[tuple[int, int]]:
    if args.sizes:
        return [tuple(int(v) for v in s.lower().split("x")) for s in args.sizes.split(",")]  # type: ignore[misc]
    return [(args.width, args.height)]


def run_job(browser, args, job: Job, size: tuple[int, int], suffix: str, theme: str | None) -> dict:
    """One flow in a fresh context. Returns log lines, shots and counters."""
    out = Path(args.out)
    result = {"log": [], "shots": [], "errors": 0, "ok": 0, "failed_checks": 0, "failed": False}
    for attempt in (1, 2):
        ctx = browser.new_context(
            viewport={"width": size[0], "height": size[1]},
            device_scale_factor=args.scale,
            color_scheme=theme if theme in ("light", "dark") else None,
            reduced_motion="reduce",
        )
        page = ctx.new_page()
        page.set_default_timeout(args.timeout)
        cap = Capture(page, args.warnings, args.ignore)
        flow = Flow(page=page, capture=cap, base=args.base, out=out, name=job.name, theme=theme,
                    freeze=args.freeze, suffix=suffix, settle_ms=args.settle, timeout_ms=args.timeout)
        url = build_url(args.base, job.route, theme, args.freeze)
        header = f"== {job.name}{suffix}{' ' + theme if theme else ''}  <- {url}"
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            settle(page, args.settle)
            if args.theme == "both":
                can_flip = page.evaluate("() => !!(window.__app && window.__app.setColorMode)")
                flow.shot_themes = ["light", "dark"] if can_flip else [None]
            flow.run(job.steps)
        except Exception as exc:
            flow.failed_step = f"navigation failed: {str(exc).splitlines()[0]}"
            try:
                body = page.evaluate("() => document.body ? document.body.innerText.slice(0, 300) : ''")
                flow.say(f"  page text: {body!r}")
            except Exception:
                pass
        errors = cap.drain()
        retry = attempt == 1 and not args.no_retry and (
            flow.reloaded or any("Outdated Optimize Dep" in e or "dynamically imported module" in e for e in errors)
        )
        ctx.close()
        if retry:
            result["log"].append(f"{header}\n  (retrying once: page reloaded or Vite re-optimized mid-flow)")
            continue
        lines = [header] + flow.log
        if flow.failed_step:
            lines.append(f"  step failed: {flow.failed_step}")
        lines += format_lines(errors)
        result["log"].append("\n".join(lines))
        result["shots"] += flow.shots
        result["errors"] += len(errors)
        result["ok"] += flow.ok
        result["failed_checks"] += flow.failed_checks
        result["failed"] = result["failed"] or bool(flow.failed_step)
        break
    return result


def run_chunk(args_dict: dict, jobs: list[tuple[Job, tuple[int, int], str, str | None]], stream: bool) -> list[dict]:
    args = argparse.Namespace(**args_dict)
    results = []
    with sync_playwright() as p:
        browser = launch(p)
        for job, size, suffix, theme in jobs:
            results.append(run_job(browser, args, job, size, suffix, theme))
            if stream:
                print("\n".join(results[-1]["log"]), flush=True)
        browser.close()
    return results


def devlog_tail(path: str, start: int) -> list[str]:
    p = Path(path)
    if not p.exists():
        return []
    with p.open("rb") as f:
        f.seek(start)
        text = f.read().decode("utf-8", "replace")
    return [ln for ln in text.splitlines() if any(k in ln.lower() for k in ("error", "warn", "page reload", "failed"))]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("routes", nargs="*", help="routes to shoot, e.g. / '/?tab=activity'")
    ap.add_argument("--base", default="http://localhost:5173")
    ap.add_argument("--out", required=True)
    ap.add_argument("--routes-file", help="one route per line, # comments")
    ap.add_argument("--flows", "--actions", action="append", help="JSON file of flows (repeatable)")
    ap.add_argument("--theme", choices=["light", "dark", "both", "none"], default="light")
    ap.add_argument("--sizes", help="viewport list, e.g. 1440x900,1280x800 (first one has no suffix)")
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--scale", type=float, default=1, help="device scale factor (2 for small-text detail)")
    ap.add_argument("--freeze", action="store_true", help="add ?freeze to every route (mock clock stopped)")
    ap.add_argument("--freeze-at", metavar="HH:MM", help="add ?freeze=HH:MM: clock stopped, now pinned to that time today")
    ap.add_argument("--settle", type=int, default=600, help="ms to wait after the page is ready")
    ap.add_argument("--timeout", type=int, default=4000, help="ms per step before it fails")
    ap.add_argument("--warnings", action="store_true", help="also report console warnings")
    ap.add_argument("--ignore", action="append", default=[], help="regex of messages to ignore (repeatable)")
    ap.add_argument("--jobs", type=int, default=1, help="parallel browser processes")
    ap.add_argument("--warmup", action="store_true", help="load each route once before shooting")
    ap.add_argument("--sheet", action="store_true", help="also write contact sheets to <out>/sheets/")
    ap.add_argument("--compare", help="folder of earlier shots: print the share changed, mark changes in <out>/diff/")
    ap.add_argument("--devlog", help="Vite dev log to tail for new errors and reloads")
    ap.add_argument("--no-retry", action="store_true", help="don't retry a flow after a mid-flow reload")
    ap.add_argument("--full-page", action="store_true", help="full-page shots for plain routes")
    args = ap.parse_args()

    # One value for the URL: None (live), "" (?freeze) or "15:00" (?freeze=15:00).
    args.freeze = args.freeze_at if args.freeze_at else ("" if args.freeze else None)
    jobs = load_jobs(args)
    if not jobs:
        ap.error("give routes, --routes-file or --flows")
    if args.full_page:
        for j in jobs:
            for s in j.steps:
                if "shot" in s:
                    s.setdefault("full", True)
    Path(args.out).mkdir(parents=True, exist_ok=True)
    sizes = parse_sizes(args)
    theme_list = {"both": ["light"], "none": [None]}.get(args.theme, [args.theme])

    expanded = []
    for job in jobs:
        for i, size in enumerate(sizes):
            suffix = "" if i == 0 else f"@{size[0]}x{size[1]}"
            for theme in theme_list:
                expanded.append((job, size, suffix, theme))

    if args.warmup:
        with sync_playwright() as p:
            browser = launch(p)
            page = browser.new_page()
            for route in sorted({j.route.split("?")[0] for j in jobs}):
                try:
                    page.goto(build_url(args.base, route), wait_until="load", timeout=90000)
                    settle(page, 300)
                except Exception as exc:
                    print(f"warmup {route}: {str(exc).splitlines()[0]}")
            browser.close()

    log_start = Path(args.devlog).stat().st_size if args.devlog and Path(args.devlog).exists() else 0
    args_dict = vars(args)
    if args.jobs > 1:
        chunks = [expanded[i :: args.jobs] for i in range(args.jobs)]
        with mp.get_context("spawn").Pool(args.jobs) as pool:
            parts = pool.starmap(run_chunk, [(args_dict, c, False) for c in chunks if c])
        results = [r for part in parts for r in part]
        for r in results:
            print("\n".join(r["log"]))
    else:
        results = run_chunk(args_dict, expanded, True)

    # When a flow ran light and the app could flip themes, `both` is already covered.
    # Without the hook, run the dark pass separately.
    if args.theme == "both" and any(not any(s["dark"] for s in r["shots"]) for r in results if r["shots"]):
        missing = [e for e, r in zip(expanded, results) if r["shots"] and not any(s["dark"] for s in r["shots"])]
        dark_jobs = [(j, size, suffix, "dark") for j, size, suffix, _ in missing]
        print(f"(no theme hook in the app: running {len(dark_jobs)} flows again in dark)")
        results += run_chunk(args_dict, dark_jobs, True)

    shots = [Path(s["file"]) for r in results for s in r["shots"]]
    errors = sum(r["errors"] for r in results)
    ok = sum(r["ok"] for r in results)
    failed_checks = sum(r["failed_checks"] for r in results)
    failed = [r for r in results if r["failed"]]

    if args.devlog:
        tail = devlog_tail(args.devlog, log_start)
        if tail:
            print(f"== new lines in {args.devlog} that mention errors, warnings or reloads:")
            print("\n".join("  " + ln for ln in tail[-40:]))

    index = Path(args.out) / "index.md"
    rows = [f"| {Path(s['file']).name} | {s['flow']} | {'dark' if s['dark'] else 'light'} | {s['url']} |"
            for r in results for s in r["shots"]]
    index.write_text("| File | Flow | Theme | URL |\n| --- | --- | --- | --- |\n" + "\n".join(rows) + "\n")

    if args.compare:
        print(f"== compared with {args.compare}")
        for f in shots:
            before = Path(args.compare) / f.name
            if before.exists():
                pct = diff(before, f, Path(args.out) / "diff" / f.name)
                print(f"  {f.name}: {pct:.2f}% changed")
            else:
                print(f"  {f.name}: new (nothing to compare)")

    if args.sheet and shots:
        sheets = contact_sheets(shots, Path(args.out) / "sheets")
        print(f"== {len(sheets)} contact sheets in {Path(args.out) / 'sheets'} (overview only: open the full PNG before judging)")

    print(
        f"== {len(shots)} shots, {errors} error lines, checks {ok} ok / {failed_checks} failed, "
        f"{len(failed)} flows stopped early. Index: {index}"
    )
    return 1 if errors or failed_checks or failed else 0


if __name__ == "__main__":
    sys.exit(main())
