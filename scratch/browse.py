"""Walk the app in ONE live browser that stays open between commands.

Use it for demo-story walkthroughs and exploration. The page is never reloaded between calls,
so the mock world keeps its state and the clock keeps running (no ?freeze). Take a shot, open it
with the Read tool, decide the next step, run it: like a person clicking through, only faster.

    uv run python browse.py start  --session qa-stories --base http://localhost:5199 [--route /] [--theme dark]
    uv run python browse.py do     --session qa-stories '[{"click": "@open-svc-billing"}, {"shot": "01-billing"}]'
    uv run python browse.py do     --session qa-stories steps.json
    uv run python browse.py shot   --session qa-stories 02-after [--selector @flyout-service]
    uv run python browse.py status --session qa-stories
    uv run python browse.py stop   --session qa-stories

Steps are the same as shoot.py flows (see uitools/steps.py): click, dblclick, fill, type, press,
hover, select, check, uncheck, scroll, nav (client-side, keeps the world), goto (full load, resets
it), back, forward, wait, wait_for, expect, advance (jump the mock clock), theme, eval, text, shot.

Each call prints errors the page logged since the previous call, and says so when the page
did a full load in between (an in-app link that bypassed the router resets the whole mock
world: that is a bug worth reporting). Shots go to work/sessions/<session>/browse/, or to --out
(relative to scratch/) on do and shot.
State lives in work/sessions/<session>/browse/state.json; `stop` kills the browser.
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

from uitools.capture import HOOK_JS, Capture, format_lines, settle, time_origin
from uitools.chrome import find_chrome
from uitools.steps import Flow, build_url

REPO = Path(__file__).resolve().parent.parent


def state_dir(session: str) -> Path:
    return REPO / "work" / "sessions" / session / "browse"


def load_state(session: str) -> dict:
    path = state_dir(session) / "state.json"
    if not path.exists():
        raise SystemExit(f"No browser for session {session!r}. Run `browse.py start --session {session} --base ...` first.")
    return json.loads(path.read_text())


def save_state(session: str, state: dict) -> None:
    (state_dir(session) / "state.json").write_text(json.dumps(state, indent=1))


def alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def connect(p, state: dict):
    browser = p.chromium.connect_over_cdp(f"http://127.0.0.1:{state['port']}")
    ctx = browser.contexts[0]
    pages = [pg for pg in ctx.pages if not pg.url.startswith("devtools://")]
    page = pages[-1] if pages else ctx.new_page()
    return browser, page


def cmd_start(args) -> int:
    d = state_dir(args.session)
    d.mkdir(parents=True, exist_ok=True)
    old = d / "state.json"
    if old.exists() and alive(json.loads(old.read_text())["pid"]):
        raise SystemExit(f"Session {args.session!r} is already running. `browse.py stop --session {args.session}` first.")
    with sync_playwright() as p:
        exe = find_chrome(p)
        if not exe:
            raise SystemExit("No Chromium found. Run `uv run python doctor.py` in scratch/ for options.")
        port = free_port()
        cmd = [
            exe, f"--remote-debugging-port={port}", f"--user-data-dir={d / 'profile'}",
            "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
            f"--window-size={args.width},{args.height}", "about:blank",
        ]
        if "headless_shell" not in exe and "headless-shell" not in exe:
            cmd.insert(1, "--headless=new")
        log = open(d / "chrome.log", "w")
        proc = subprocess.Popen(cmd, stdout=log, stderr=log, start_new_session=True)
        for _ in range(100):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1)
                break
            except Exception:
                time.sleep(0.15)
        else:
            proc.kill()
            raise SystemExit(f"Chromium did not start; see {d / 'chrome.log'}")
        state = {"pid": proc.pid, "port": port, "base": args.base, "theme": args.theme,
                 "width": args.width, "height": args.height, "origin": None}
        browser, page = connect(p, state)
        page.set_viewport_size({"width": args.width, "height": args.height})
        page.emulate_media(color_scheme=args.theme, reduced_motion="reduce")
        page.add_init_script(HOOK_JS)
        page.goto(build_url(args.base, args.route, args.theme), wait_until="domcontentloaded", timeout=60000)
        settle(page, 600)
        page.evaluate(HOOK_JS)
        state["origin"] = time_origin(page)
        save_state(args.session, state)
        print(f"browser for {args.session!r} on port {port} (pid {proc.pid}), at {page.url}")
    return 0


def run_steps(args, steps: list[dict]) -> int:
    state = load_state(args.session)
    if not alive(state["pid"]):
        raise SystemExit(f"The browser for {args.session!r} is gone. Start it again.")
    out = Path(args.out) if getattr(args, "out", None) else state_dir(args.session)
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        _, page = connect(p, state)
        # Emulation belongs to the connection, so set it again on every call.
        page.set_viewport_size({"width": state["width"], "height": state["height"]})
        page.emulate_media(color_scheme=state["theme"], reduced_motion="reduce")
        page.set_default_timeout(args.timeout)
        cap = Capture(page, args.warnings, args.ignore)
        page.evaluate(HOOK_JS)  # after a reload the hook is gone; installing it again is harmless
        since = [ln for ln in cap.drain()]
        now = time_origin(page)
        if state.get("origin") and now and now != state["origin"]:
            since.insert(0, "full page load since the last call: the mock world was reset")
        flow = Flow(page=page, capture=cap, base=state["base"], out=out, name=args.session,
                    theme=state["theme"], timeout_ms=args.timeout, settle_ms=args.settle)
        if args.both:
            flow.shot_themes = ["light", "dark"]
        flow.taken = {f.stem for f in out.glob("*.png")} if not args.overwrite else set()
        flow.run(steps)
        errors = cap.drain()
        state["origin"] = time_origin(page)
        save_state(args.session, state)
        print(f"at {page.url}")
        if since:
            print("errors or reloads since the last call:")
            print("\n".join(format_lines(since)))
        print("\n".join(flow.log))
        if flow.failed_step:
            print(f"step failed: {flow.failed_step}")
        if errors:
            print("errors during this call:")
            print("\n".join(format_lines(errors)))
    return 1 if errors or flow.failed_step or flow.failed_checks else 0


def cmd_do(args) -> int:
    raw = args.steps
    text = Path(raw).read_text() if Path(raw).exists() else raw
    steps = json.loads(text)
    if isinstance(steps, dict):
        steps = [steps]
    return run_steps(args, steps)


def cmd_shot(args) -> int:
    step: dict = {"shot": args.name}
    if args.selector:
        step["selector"] = args.selector
    if args.full:
        step["full"] = True
    return run_steps(args, [step])


def cmd_status(args) -> int:
    args.both, args.overwrite = False, False
    return run_steps(args, [{"eval": "() => ({ title: document.title, url: location.href })"}])


def cmd_stop(args) -> int:
    path = state_dir(args.session) / "state.json"
    if not path.exists():
        print(f"no browser for {args.session!r}")
        return 0
    state = json.loads(path.read_text())
    try:
        os.killpg(state["pid"], signal.SIGTERM)
    except OSError:
        pass
    path.unlink()
    print(f"stopped the browser for {args.session!r}; shots stay in {state_dir(args.session)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("--session", required=True, help="usually your task id")
        sp.add_argument("--timeout", type=int, default=4000)
        sp.add_argument("--settle", type=int, default=600)
        sp.add_argument("--warnings", action="store_true")
        sp.add_argument("--ignore", action="append", default=[])
        sp.add_argument("--out", help="folder for shots (default work/sessions/<session>/browse)")

    sp = sub.add_parser("start")
    sp.add_argument("--session", required=True)
    sp.add_argument("--base", required=True)
    sp.add_argument("--route", default="/")
    sp.add_argument("--theme", choices=["light", "dark"], default="light")
    sp.add_argument("--width", type=int, default=1440)
    sp.add_argument("--height", type=int, default=900)
    sp.set_defaults(fn=cmd_start)

    sp = sub.add_parser("do")
    common(sp)
    sp.add_argument("steps", help="JSON list of steps, or a path to a JSON file")
    sp.add_argument("--both", action="store_true", help="each shot in light and dark")
    sp.add_argument("--overwrite", action="store_true", help="reuse shot names instead of adding -2, -3")
    sp.set_defaults(fn=cmd_do)

    sp = sub.add_parser("shot")
    common(sp)
    sp.add_argument("name")
    sp.add_argument("--selector")
    sp.add_argument("--full", action="store_true")
    sp.add_argument("--both", action="store_true")
    sp.add_argument("--overwrite", action="store_true")
    sp.set_defaults(fn=cmd_shot)

    sp = sub.add_parser("status")
    common(sp)
    sp.set_defaults(fn=cmd_status)

    sp = sub.add_parser("stop")
    sp.add_argument("--session", required=True)
    sp.set_defaults(fn=cmd_stop)

    args = ap.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
