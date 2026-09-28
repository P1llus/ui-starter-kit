"""Check that this machine can run the kit: Node, npm, uv, Chromium, dependencies, headroom.

    uv run python doctor.py          # report
    uv run python doctor.py --save   # also remember the Chromium it found in scratch/.chrome-path

Prints one line per check (OK, WARN or MISSING) with a hint, and exits 1 if something required
is missing. Also lists dev servers still listening on ports 5100-5999 (orphans after a crash).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
UI = REPO / "ui"

rows: list[tuple[str, str, str, str]] = []


def add(status: str, what: str, found: str, hint: str = "") -> None:
    rows.append((status, what, found, hint))


def run(cmd: list[str], cwd: Path | None = None) -> str | None:
    try:
        return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception:
        return None


def version_tuple(text: str) -> tuple[int, ...]:
    m = re.search(r"(\d+)\.(\d+)\.(\d+)", text or "")
    return tuple(int(x) for x in m.groups()) if m else (0, 0, 0)


def check_node() -> None:
    v = run(["node", "--version"], cwd=UI)
    if not v:
        add("MISSING", "node", "not found", "nvm install 24 && nvm use 24 (or Node 24+ from fnm, volta, mise, proto or the system)")
        return
    t = version_tuple(v)
    ok = t >= (24, 0, 0)
    add("OK" if ok else "MISSING", "node", f"{v} ({shutil.which('node')})",
        "" if ok else "the kit needs Node 24+ (ui/.nvmrc): nvm install 24 && nvm use 24")
    managers = [m for m in ("nvm", "fnm", "volta", "mise", "asdf", "proto") if shutil.which(m) or (Path.home() / f".{m}").exists()]
    add("OK", "node managers seen", ", ".join(managers) or "none",
        "if `which node` is another manager's shim, make sure it resolves to Node 24+ too" if len(managers) > 1 else "")
    npm = run(["npm", "--version"], cwd=UI)
    add("OK" if npm else "MISSING", "npm", npm or "not found")


def check_ui() -> None:
    if not (UI / "node_modules").exists():
        add("WARN", "ui dependencies", "ui/node_modules missing", "(cd ui && npm install)")
        return
    pkg = json.loads((UI / "package.json").read_text())
    missing = [d for d in {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})} if not (UI / "node_modules" / d).exists()]
    add("WARN" if missing else "OK", "ui dependencies", f"{len(missing)} missing" if missing else "installed",
        "(cd ui && npm install)" if missing else "")


def check_python() -> None:
    add("OK", "python (scratch env)", sys.version.split()[0])
    uv = run(["uv", "--version"])
    add("OK" if uv else "WARN", "uv", uv or "not on PATH", "" if uv else "install uv: https://docs.astral.sh/uv/")


def check_chrome(save: bool) -> None:
    from playwright.sync_api import sync_playwright

    from uitools.chrome import SAVED, candidates

    with sync_playwright() as p:
        found = candidates(p)
        if not found:
            add("MISSING", "chromium", "none found",
                "(cd scratch && uv run playwright install chromium) (about 150 MB), or set CHROME_PATH")
            return
        source, exe = found[0]
        try:
            browser = p.chromium.launch(executable_path=exe)
            version = browser.version
            browser.close()
            add("OK", "chromium", f"{version} from {source}: {exe}")
            if save:
                SAVED.write_text(exe + "\n")
                add("OK", "saved", str(SAVED))
        except Exception as exc:
            add("MISSING", "chromium", f"{exe} did not launch: {str(exc).splitlines()[0]}",
                "on Linux it may need system libraries: uv run playwright install-deps chromium")


def check_headroom() -> None:
    free = shutil.disk_usage(REPO).free / 1e9
    add("OK" if free > 5 else "WARN", "free disk", f"{free:.1f} GB",
        "" if free > 5 else "screenshots add up (a full build took about 1.5 GB of work/sessions)")
    mem = None
    if Path("/proc/meminfo").exists():
        m = re.search(r"MemAvailable:\s+(\d+)", Path("/proc/meminfo").read_text())
        mem = int(m.group(1)) / 1e6 if m else None
    cpus = os.cpu_count() or 1
    if mem is not None:
        per = 1.0  # a builder runs Vite, tsc and Chromium: about 1 GB
        add("OK", "memory / cpus", f"{mem:.1f} GB available, {cpus} cpus",
            f"room for about {max(1, int(mem / per) - 1)} parallel builders by memory; usage limits usually bind first")
    else:
        add("OK", "cpus", str(cpus))


def check_servers() -> None:
    out = run(["ss", "-ltnp"]) or run(["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"])
    if out is None:
        return
    ports = sorted({int(p) for p in re.findall(r":(5[1-9]\d\d)\b", out)})
    add("WARN" if ports else "OK", "dev servers on 5100-5999", ", ".join(map(str, ports)) or "none",
        "orphans from a crashed run? kill them by PID from `ss -ltnp`" if ports else "")


def check_git() -> None:
    inside = run(["git", "rev-parse", "--is-inside-work-tree"], cwd=REPO)
    if inside != "true":
        add("WARN", "git", "not a repository", "git init -b main")
        return
    count = run(["git", "rev-list", "--count", "HEAD"], cwd=REPO) or "0"
    remote = run(["git", "remote", "get-url", "origin"], cwd=REPO) or "no origin"
    add("OK", "git", f"{count} commits, origin: {remote}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--save", action="store_true", help="write the Chromium path to scratch/.chrome-path")
    args = ap.parse_args()
    check_git()
    check_node()
    check_ui()
    check_python()
    check_chrome(args.save)
    check_headroom()
    check_servers()
    width = max(len(r[1]) for r in rows)
    for status, what, found, hint in rows:
        print(f"{status:8} {what:<{width}}  {found}" + (f"\n{'':8} {'':<{width}}  -> {hint}" if hint else ""))
    return 1 if any(r[0] == "MISSING" for r in rows) else 0


if __name__ == "__main__":
    sys.exit(main())
