"""Error capture and page readiness for Playwright pages.

Errors come from five places, and each one has caught bugs the others missed:
- console.error (and console.warning with warnings=True), which includes React warnings in dev
- uncaught exceptions (`pageerror`), where React render errors land
- window 'error' and 'unhandledrejection' events, installed by an init script; ResizeObserver
  loop errors only show up here
- failed requests and HTTP responses >= 400
- the Vite error overlay text
"""

from __future__ import annotations

import re
from collections import Counter

from playwright.sync_api import Page

# In-page hook. Idempotent, so browse.py can install it again on an existing page.
HOOK_JS = r"""
(() => {
  if (window.__shoot) return;
  const errors = [];
  window.__shoot = { errors };
  const text = (v) => {
    if (v instanceof Error) return v.stack || v.message;
    try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); }
  };
  window.addEventListener('error', (e) => {
    // Resource load errors have no message; failed requests are reported separately.
    if (e.message) errors.push('window.error: ' + e.message);
  });
  window.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + text(e.reason)));
  const origError = console.error.bind(console);
  console.error = (...args) => { errors.push('console.error: ' + args.map(text).join(' ')); origError(...args); };
})();
"""

DEFAULT_IGNORE = [
    r"Download the React DevTools",
    r"\[vite\] (connecting|connected|hot updated|server connection lost)",
]

VITE_RETRY = [r"Outdated Optimize Dep", r"Failed to fetch dynamically imported module", r"504 \(Outdated"]

MAX_LINES = 8


class Capture:
    """Collects everything worth reporting from one page. Call `drain()` to take the lines."""

    def __init__(self, page: Page, warnings: bool = False, ignore: list[str] | None = None):
        self.page = page
        self.lines: list[str] = []
        self.ignore = [re.compile(p) for p in (DEFAULT_IGNORE + (ignore or []))]
        kinds = {"error", "warning"} if warnings else {"error"}

        def on_console(msg):
            if msg.type in kinds:
                loc = msg.location or {}
                where = f" ({loc.get('url', '')}:{loc.get('lineNumber', '')})" if loc.get("url") else ""
                self.add(f"console.{msg.type}: {msg.text}{where}")

        page.on("console", on_console)
        page.on("pageerror", lambda exc: self.add(f"pageerror: {exc}"))
        page.on("requestfailed", lambda req: self.add(f"requestfailed: {req.url} ({req.failure})"))
        page.on("response", lambda res: res.status >= 400 and self.add(f"http {res.status}: {res.url}"))
        page.add_init_script(HOOK_JS)

    def add(self, line: str) -> None:
        if not any(p.search(line) for p in self.ignore):
            self.lines.append(line)

    def collect_page_hook(self) -> None:
        """Pull window.error / unhandledrejection lines from the in-page hook.

        console.error lines are already captured by the console listener, so the hook's copies
        are dropped here to avoid doubles.
        """
        try:
            found = self.page.evaluate("() => window.__shoot ? window.__shoot.errors.splice(0) : []")
        except Exception:
            return
        for line in found:
            if not line.startswith("console.error: "):
                self.add(line)
        overlay = vite_overlay(self.page)
        if overlay:
            self.add(f"vite-error-overlay: {overlay}")

    def drain(self) -> list[str]:
        self.collect_page_hook()
        out, self.lines = self.lines, []
        return out

    def wants_vite_retry(self) -> bool:
        return any(re.search(p, line) for p in VITE_RETRY for line in self.lines)


def format_lines(lines: list[str], indent: str = "  ") -> list[str]:
    """Dedupe with counts and cut long stacks."""
    out = []
    for line, count in Counter(lines).items():
        text = line.splitlines()
        if len(text) > MAX_LINES:  # React component stacks run long
            text = text[:MAX_LINES] + [f"... ({len(text) - MAX_LINES} more lines)"]
        out.append(indent + ("\n" + indent + "  ").join(text) + (f"  [x{count}]" if count > 1 else ""))
    return out


def vite_overlay(page: Page) -> str | None:
    try:
        return page.evaluate(
            """() => {
                const el = document.querySelector('vite-error-overlay');
                if (!el || !el.shadowRoot) return null;
                const msg = el.shadowRoot.querySelector('.message');
                return (msg ? msg.textContent : el.shadowRoot.textContent || '').trim().slice(0, 2000);
            }"""
        )
    except Exception:
        return None


def time_origin(page: Page) -> float | None:
    """Changes on every full page load. A change mid-flow means the mock world was reset."""
    try:
        return page.evaluate("() => performance.timeOrigin")
    except Exception:
        return None


def settle(page: Page, ms: int) -> None:
    """Wait until the page is ready to shoot: load, fonts, lazy icons, finite animations, then `ms`.

    Network idle is only a short best-effort wait: a live app with tickers never goes idle.
    """
    for state, timeout in (("load", 30000), ("networkidle", 3000)):
        try:
            page.wait_for_load_state(state, timeout=timeout)
        except Exception:
            pass
    try:
        page.evaluate("() => document.fonts ? document.fonts.ready.then(() => true) : true")
        # EUI marks icons that are still loading their SVG chunk.
        page.wait_for_function("() => !document.querySelector('[data-is-loading]')", timeout=5000)
    except Exception:
        pass
    try:
        page.wait_for_function(
            """() => document.getAnimations().every(a => {
                const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
                return a.playState !== 'running' || !t || t.iterations === Infinity;
            })""",
            timeout=3000,
        )
    except Exception:
        pass
    page.wait_for_timeout(ms)
