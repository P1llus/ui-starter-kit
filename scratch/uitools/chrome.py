"""Find a Chromium binary for Playwright without downloading one.

Order: $CHROME_PATH, $PLAYWRIGHT_CHROMIUM_EXECUTABLE, scratch/.chrome-path (written by
`doctor.py --save`), Playwright's own managed browser, browsers already in the usual Playwright
caches (including $PLAYWRIGHT_BROWSERS_PATH), then a system Chrome or Chromium.

If nothing is found, `uv run playwright install chromium` downloads one (about 150 MB), or set
CHROME_PATH to any Chrome/Chromium binary.
"""

from __future__ import annotations

import glob
import os
import re
import shutil
from pathlib import Path

SCRATCH = Path(__file__).resolve().parent.parent
SAVED = SCRATCH / ".chrome-path"

_CACHE_GLOBS = [
    "chromium-*/chrome-linux*/chrome",
    "chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium",
    "chromium-*/chrome-mac*/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    "chromium-*/chrome-win*/chrome.exe",
    "chromium_headless_shell-*/chrome-*/headless_shell",
    "chromium_headless_shell-*/chrome-*/chrome-headless-shell",
]
_CACHE_DIRS = [
    "~/.cache/ms-playwright",
    "~/Library/Caches/ms-playwright",
    "~/AppData/Local/ms-playwright",
    "/opt/pw-browsers",
    "/ms-playwright",
]
_SYSTEM = ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "chrome"]
_MAC_APPS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
]


def _build_number(path: str) -> int:
    m = re.search(r"chromium(?:_headless_shell)?-(\d+)", path)
    return int(m.group(1)) if m else 0


def candidates(playwright=None) -> list[tuple[str, str]]:
    """Every Chromium we can see, as (source, path), best first."""
    out: list[tuple[str, str]] = []
    for env in ("CHROME_PATH", "PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
        if os.environ.get(env):
            out.append((f"${env}", os.environ[env]))
    if SAVED.exists() and SAVED.read_text().strip():
        out.append((str(SAVED.name), SAVED.read_text().strip()))
    if playwright is not None:
        try:
            out.append(("playwright", playwright.chromium.executable_path))
        except Exception:
            pass
    dirs = list(_CACHE_DIRS)
    if os.environ.get("PLAYWRIGHT_BROWSERS_PATH"):
        dirs.insert(0, os.environ["PLAYWRIGHT_BROWSERS_PATH"])
    found: list[str] = []
    for d in dirs:
        base = os.path.expanduser(d)
        for pattern in _CACHE_GLOBS:
            found += glob.glob(os.path.join(base, pattern))
    # Full Chromium before the headless shell, newest build first.
    found.sort(key=lambda p: ("headless" not in p, _build_number(p)), reverse=True)
    out += [("cache", p) for p in found]
    for name in _SYSTEM:
        if shutil.which(name):
            out.append(("system", shutil.which(name)))
    out += [("system", p) for p in _MAC_APPS]
    return [(src, p) for src, p in out if p and Path(p).exists()]


def find_chrome(playwright=None) -> str | None:
    found = candidates(playwright)
    return found[0][1] if found else None


def launch(playwright, **kwargs):
    """Launch Chromium from the first binary found. Exits with instructions if there is none."""
    exe = find_chrome(playwright)
    if not exe:
        raise SystemExit(
            "No Chromium found. Run `uv run playwright install chromium` in scratch/, "
            "or set CHROME_PATH to a Chrome or Chromium binary."
        )
    return playwright.chromium.launch(executable_path=exe, **kwargs)
