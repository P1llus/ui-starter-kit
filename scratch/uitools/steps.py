"""Step runner shared by shoot.py (batch flows) and browse.py (one live session).

A flow is a list of steps run in ONE page session, so state survives between steps. A full
page load resets the mock world, so move with `nav` (client-side) rather than `goto`.

Each step is an object with exactly one action key, plus options:

  {"click": "@save"}                      click; "@save" means [data-test-subj="save"]
  {"dblclick": "text=Billing"}
  {"fill": "@search", "value": "okta"}    replace an input's value
  {"type": "@search", "value": "ok", "delay": 50}  key by key (autocomplete, palettes)
  {"press": "Escape"} / {"press": "Enter", "on": "@search"}
  {"hover": "@row-1"}
  {"select": "@owner", "value": "payments"}   (or "label": "Payments")
  {"check": "@enabled"} / {"uncheck": "@enabled"}
  {"scroll": "@footer"} / {"scroll": {"y": 600}} / {"scroll": {"to": "bottom"}}
  {"goto": "/path?x=1"}                   full page load (resets the mock world)
  {"nav": "/path?x=1"}                    client-side, keeps the world (window.__app.navigate)
  {"back": true} / {"forward": true}
  {"wait": 500}                           milliseconds; prefer wait_for
  {"wait_for": "@flyout-service"}         until visible; or an object, see conditions
  {"expect": {"text": "Restarted"}}       a check: prints OK/FAIL, a FAIL fails the run
  {"advance": "90s"}                      jump the mock clock (window.__mock.advance)
  {"theme": "dark"}                       flip the colour mode on the current state
  {"eval": "() => document.title"}        run JS, print the result
  {"text": "@summary"}                    print an element's text
  {"shot": "name"}                        screenshot; options: "selector", "pad", "full"

Conditions for wait_for and expect: a selector string (visible), or one of
  {"visible": sel} {"gone": sel} {"text": "Saved", "in": sel?} {"url": "flyout=service"}
  {"title": "Home"} {"count": [sel, 3]} {"value": [sel, "okta"]} {"fn": "() => ..."}
Any step takes "timeout" (ms). Selectors are Playwright selectors: CSS, "text=Label",
"role=button[name='Save']", ">> nth=1" and so on.
"""

from __future__ import annotations

import difflib
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from playwright.sync_api import Page

from .capture import Capture, settle, time_origin
from .images import tile_if_tall

ACTIONS = [
    "click", "dblclick", "fill", "type", "press", "hover", "select", "check", "uncheck", "scroll",
    "goto", "nav", "back", "forward", "wait", "wait_for", "expect", "advance", "theme", "eval",
    "text", "shot",
]


def sel(selector: str) -> str:
    """`@save` -> `[data-test-subj="save"]`, anywhere a token starts (`@row >> @menu`, `@a @b`)."""
    return re.sub(r'(^|[\s>+~(,])@([\w.:\-]+)', lambda m: f'{m.group(1)}[data-test-subj="{m.group(2)}"]', selector.strip())


def build_url(base: str, route: str, theme: str | None = None, freeze: str | None = None) -> str:
    """Base + route, with ?theme= and ?freeze merged into the route's own query."""
    parts = urlsplit(base.rstrip("/") + "/" + route.lstrip("/"))
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k not in ("theme",)]
    if theme in ("light", "dark"):
        query.append(("theme", theme))
    if freeze is not None and not any(k == "freeze" for k, _ in query):
        query.append(("freeze", freeze))
    return urlunsplit(parts._replace(query=urlencode(query)))


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:100] or "root"


@dataclass
class Flow:
    page: Page
    capture: Capture
    base: str
    out: Path
    name: str
    theme: str | None = None  # the theme the page loaded in
    shot_themes: list[str | None] = field(default_factory=lambda: [None])  # per shot, when flipping works
    freeze: str | None = None
    suffix: str = ""  # e.g. "@1280x800"
    settle_ms: int = 600
    step_settle_ms: int = 250
    timeout_ms: int = 4000
    log: list[str] = field(default_factory=list)
    shots: list[dict] = field(default_factory=list)
    taken: set[str] = field(default_factory=set)
    ok: int = 0
    failed_checks: int = 0
    failed_step: str | None = None
    reloaded: bool = False
    origin: float | None = None
    inflight: int = 0

    def __post_init__(self) -> None:
        # Count requests ourselves: Playwright's "networkidle" only covers the first page load, so
        # after a click it can't see a lazy chunk (a flyout's code) that Vite is still compiling.
        def up(_):
            self.inflight += 1

        def down(_):
            self.inflight = max(0, self.inflight - 1)

        self.page.on("request", up)
        self.page.on("requestfinished", down)
        self.page.on("requestfailed", down)

    # ------------------------------------------------------------------ helpers
    def say(self, line: str) -> None:
        self.log.append(line)

    def loc(self, selector: str):
        return self.page.locator(sel(selector)).first

    def _unique(self, stem: str) -> str:
        name, n = stem, 2
        while name in self.taken:
            name, n = f"{stem}-{n}", n + 1
        self.taken.add(name)
        return name

    def check_reload(self, where: str) -> None:
        now = time_origin(self.page)
        if self.origin is not None and now is not None and now != self.origin:
            self.reloaded = True
            self.capture.add(
                f"full page load during the flow ({where}): the mock world was reset. Either an in-app "
                "link bypassed the router (a bug), or the dev server reloaded after a file edit."
            )
        self.origin = now

    # ------------------------------------------------------------------ steps
    def run(self, steps: list[dict]) -> bool:
        self.origin = time_origin(self.page)
        for i, step in enumerate(steps, 1):
            try:
                action = action_of(step)
            except ValueError as exc:
                self.failed_step = str(exc)
                self.say(f"  step {i}: {exc}")
                return False
            try:
                self._do(action, step)
            except Exception as exc:  # stop at the first failed step, keep evidence
                first = str(exc).strip().splitlines()[0] if str(exc).strip() else type(exc).__name__
                detail = [ln.strip() for ln in str(exc).splitlines() if "intercepts pointer events" in ln][:1]
                self.failed_step = f"step {i} {action} {json.dumps(step[action])}: {first}"
                self.say(f"  FAILED {self.failed_step}")
                for ln in detail:
                    self.say(f"    {ln}")
                self._suggest(step.get(action))
                self._failed_shot()
                return False
            if action not in ("goto",):
                self.check_reload(f"after step {i} {action}")
        return True

    def _do(self, action: str, step: dict) -> None:
        page, value = self.page, step[action]
        timeout = step.get("timeout", self.timeout_ms)
        if action == "click":
            self.loc(value).click(timeout=timeout, force=step.get("force", False))
        elif action == "dblclick":
            self.loc(value).dblclick(timeout=timeout)
        elif action == "fill":
            self.loc(value).fill(str(step.get("value", "")), timeout=timeout)
        elif action == "type":
            keys = step.get("value", step.get("text", ""))  # "text" kept for older flows
            self.loc(value).press_sequentially(str(keys), delay=step.get("delay", 40), timeout=timeout)
        elif action == "press":
            if step.get("on"):
                self.loc(step["on"]).press(value, timeout=timeout)
            else:
                page.keyboard.press(value)
        elif action == "hover":
            self.loc(value).hover(timeout=timeout)
        elif action == "select":
            opt = {"label": step["label"]} if "label" in step else {"value": step.get("value")}
            self.loc(value).select_option(**opt, timeout=timeout)
        elif action in ("check", "uncheck"):
            getattr(self.loc(value), action)(timeout=timeout)
        elif action == "scroll":
            if isinstance(value, str):
                self.loc(value).scroll_into_view_if_needed(timeout=timeout)
            elif value.get("to") == "bottom":
                page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
            elif value.get("to") == "top":
                page.evaluate("() => window.scrollTo(0, 0)")
            else:
                page.mouse.wheel(0, value.get("y", 600))
        elif action == "goto":
            page.goto(build_url(self.base, value, self.theme, self.freeze), wait_until="domcontentloaded", timeout=60000)
            settle(page, self.settle_ms)
            self.origin = time_origin(page)
            return
        elif action == "nav":
            if page.evaluate("() => !!(window.__app && window.__app.navigate)"):
                page.evaluate("href => window.__app.navigate(href)", value)
            else:
                self.say("  note: no window.__app.navigate, so `nav` did a full load (the mock world was reset)")
                page.goto(build_url(self.base, value, self.theme, self.freeze), wait_until="domcontentloaded")
                self.origin = None
            settle(page, self.settle_ms)
            return
        elif action in ("back", "forward"):
            (page.go_back if action == "back" else page.go_forward)(wait_until="commit")
        elif action == "wait":
            page.wait_for_timeout(int(value))
            return
        elif action == "wait_for":
            self._condition(value, step, timeout)
        elif action == "expect":
            try:
                self._condition(value, step, step.get("timeout", 3000))
                self.ok += 1
                self.say(f"  OK   expect {json.dumps(value)}")
            except Exception as exc:
                self.failed_checks += 1
                self.say(f"  FAIL expect {json.dumps(value)}: {str(exc).splitlines()[0] if str(exc) else exc}")
            return
        elif action == "advance":
            if not page.evaluate("() => !!(window.__mock && window.__mock.advance)"):
                raise RuntimeError("the app has no window.__mock.advance hook")
            page.evaluate("by => window.__mock.advance(by)", value)
        elif action == "theme":
            self._set_theme(value)
        elif action == "eval":
            result = page.evaluate(value)
            self.say(f"  eval -> {json.dumps(result, default=str)[:800]}")
            return
        elif action == "text":
            self.say(f"  text {value}: {self.loc(value).inner_text(timeout=timeout)[:800]!r}")
            return
        elif action == "shot":
            self._shot(step)
            return
        self._after_action()

    def _after_action(self) -> None:
        """Let what the action started finish before the next step: a lazy chunk (a flyout's code),
        EUI icons still loading, a slide-in animation. Each wait is short and best-effort."""
        page = self.page
        page.wait_for_timeout(100)  # let the action start its requests
        end, quiet = time.monotonic() + 8, None
        while time.monotonic() < end:  # no request in flight for 300 ms
            if self.inflight == 0:
                quiet = quiet or time.monotonic()
                if time.monotonic() - quiet >= 0.3:
                    break
            else:
                quiet = None
            page.wait_for_timeout(50)
        for wait in (
            # Late mounts (a lazy flyout, a portal): wait until the DOM has been quiet for 300 ms.
            lambda: page.evaluate(
                """() => new Promise((done) => {
                    let timer = setTimeout(finish, 300);
                    const cap = setTimeout(finish, 3000);
                    const obs = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(finish, 300); });
                    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
                    function finish() { obs.disconnect(); clearTimeout(timer); clearTimeout(cap); done(true); }
                })"""
            ),
            lambda: page.wait_for_function("() => !document.querySelector('[data-is-loading]')", timeout=2000),
            lambda: page.wait_for_function(
                """() => document.getAnimations().every(a => {
                    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
                    return a.playState !== 'running' || !t || t.iterations === Infinity;
                })""",
                timeout=2000,
            ),
        ):
            try:
                wait()
            except Exception:
                pass
        page.wait_for_timeout(self.step_settle_ms)

    def _condition(self, cond: Any, step: dict, timeout: int) -> None:
        page = self.page
        if isinstance(cond, str):
            cond = {"visible": cond}
        if "visible" in cond:
            self.loc(cond["visible"]).wait_for(state="visible", timeout=timeout)
        elif "gone" in cond:
            self.loc(cond["gone"]).wait_for(state="hidden", timeout=timeout)
        elif "text" in cond:
            scope = page.locator(sel(cond["in"])) if cond.get("in") else page
            scope.get_by_text(cond["text"]).first.wait_for(state="visible", timeout=timeout)
        elif "url" in cond:
            _poll(lambda: cond["url"] in page.url, timeout, f"url containing {cond['url']!r}, got {page.url}")
        elif "title" in cond:
            _poll(lambda: cond["title"] in page.title(), timeout, f"title containing {cond['title']!r}")
        elif "count" in cond:
            target, n = cond["count"]
            _poll(lambda: page.locator(sel(target)).count() == n, timeout,
                  f"{n} of {target}, got {page.locator(sel(target)).count()}")
        elif "value" in cond:
            target, want = cond["value"]
            _poll(lambda: self.loc(target).input_value() == want, timeout, f"{target} value {want!r}")
        elif "fn" in cond:
            page.wait_for_function(cond["fn"], timeout=timeout)
        else:
            raise ValueError(f"unknown condition {cond}")

    def _set_theme(self, mode: str) -> None:
        page = self.page
        page.emulate_media(color_scheme=mode)
        if page.evaluate("() => !!(window.__app && window.__app.setColorMode)"):
            page.evaluate("m => window.__app.setColorMode(m)", mode)
        else:
            raise RuntimeError("the app has no window.__app.setColorMode hook")
        settle(page, 250)

    def _shot(self, step: dict) -> None:
        page = self.page
        stem = step["shot"] if isinstance(step["shot"], str) else f"{self.name}-{len(self.shots) + 1}"
        flipped = False
        for theme in self.shot_themes:
            if theme and theme != self.theme:
                self._set_theme(theme)
                flipped = True
            dark = (theme or self.theme) == "dark"
            name = self._unique(f"{slug(stem)}{self.suffix}{'-dark' if dark else ''}")
            path = self.out / f"{name}.png"
            if step.get("selector"):
                target = self.loc(step["selector"])
                pad = int(step.get("pad", 0))
                if pad:
                    target.scroll_into_view_if_needed()
                    box = target.bounding_box()
                    if not box:
                        raise RuntimeError(f"{step['selector']} has no box (hidden?)")
                    # The box is in viewport coordinates; a full-page clip takes document coordinates.
                    sx, sy = page.evaluate("() => [window.scrollX, window.scrollY]")
                    page.screenshot(path=str(path), full_page=True, clip={
                        "x": max(0, box["x"] + sx - pad), "y": max(0, box["y"] + sy - pad),
                        "width": box["width"] + 2 * pad, "height": box["height"] + 2 * pad,
                    })
                else:
                    target.screenshot(path=str(path))
            else:
                page.screenshot(path=str(path), full_page=bool(step.get("full")))
            files = tile_if_tall(path)
            # A flipped theme doesn't change the URL; record the one that reproduces this shot.
            url = re.sub(r"theme=(light|dark)", f"theme={'dark' if dark else 'light'}", page.url)
            for f in files:
                self.shots.append({"file": str(f), "url": url, "flow": self.name, "dark": dark})
                self.say(f"  saved {f}")
        if flipped:
            self._set_theme(self.theme or "light")

    def _failed_shot(self) -> None:
        try:
            path = self.out / f"{slug(self.name)}{self.suffix}.FAILED.png"
            self.page.screenshot(path=str(path))
            self.say(f"  saved {path} (state at the failure)")
        except Exception:
            pass

    def _suggest(self, target: Any) -> None:
        """Print visible elements that look like what the failed step wanted."""
        if not isinstance(target, str):
            return
        try:
            found = self.page.evaluate(CANDIDATES_JS)
        except Exception:
            return
        want = re.sub(r"^(text=|@)|\[data-test-subj=|[\]\"'>=]", " ", target).strip().lower()
        scored = []
        for el in found:
            label = el["subj"] or el["text"]
            if not label:
                continue
            ratio = difflib.SequenceMatcher(None, want, label.lower()).ratio()
            scored.append((ratio, el))
        scored.sort(key=lambda x: -x[0])
        if scored:
            self.say("    visible candidates:")
            for _, el in scored[:8]:
                use = f"@{el['subj']}" if el["subj"] else f"text={el['text']}"
                self.say(f"      {use}   <{el['tag']}> {el['text']!r}")


CANDIDATES_JS = """() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const els = [...document.querySelectorAll(
    'button, a, [role=button], [role=tab], [role=menuitem], [role=option], [data-test-subj], input, select, textarea'
  )].filter(visible);
  return els.slice(0, 500).map((el) => ({
    tag: el.tagName.toLowerCase(),
    subj: el.getAttribute('data-test-subj'),
    text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().split('\\n')[0].slice(0, 60),
  }));
}"""


def action_of(step: dict) -> str:
    keys = [k for k in step if k in ACTIONS]
    if "type" in keys and "text" in keys:  # older flows passed the keys to type as "text"
        keys.remove("text")
    if len(keys) != 1:
        raise ValueError(f"a step needs exactly one action key ({', '.join(ACTIONS)}): {json.dumps(step)}")
    return keys[0]


def _poll(fn: Callable[[], bool], timeout: int, what: str) -> None:
    end = time.monotonic() + timeout / 1000
    while True:
        try:
            if fn():
                return
        except Exception:
            pass
        if time.monotonic() > end:
            raise TimeoutError(f"timed out after {timeout} ms waiting for {what}")
        time.sleep(0.1)
