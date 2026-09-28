"""Check relative markdown links and anchors.

Scans docs/**, work/briefs/**, work/playbook/**, .agents/skills/**, README.md, AGENTS.md and ORCHESTRATOR.md.
Template folders are skipped: their links resolve only once copied. For every relative link it checks that the target file or folder exists and, when the link
has a #fragment into a markdown file, that a heading with that GitHub slug exists.

Run from the repo root:
     (cd scratch && uv run python check_links.py)
     (cd scratch && uv run python check_links.py --allow-missing)   # before the spec phase ends

--allow-missing lists links to files that don't exist yet (docs a later phase writes) without
failing; broken anchors and everything else still fail. From the end of the spec phase on, run
it without the flag. Exit code 1 when any link is broken.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
TOP_FILES = ["README.md", "AGENTS.md", "ORCHESTRATOR.md"]

INLINE_LINK = re.compile(r"(?<!\!)\[(?:[^\[\]]|\[[^\]]*\])*\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
IMAGE_LINK = re.compile(r"!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
REF_DEF = re.compile(r"^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+.*)?$")
HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
HTML_ANCHOR = re.compile(r"<a\s+[^>]*(?:id|name)=\"([^\"]+)\"", re.I)
FENCE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE = re.compile(r"(`+)(?:(?!\1).)+?\1")


SCAN_DIRS = ["docs", "work/briefs", "work/playbook", ".agents/skills"]


def md_files() -> list[Path]:
    files: list[Path] = []
    for d in SCAN_DIRS:
        if (ROOT / d).exists():
            files += sorted((ROOT / d).rglob("*.md"))
    files += [ROOT / f for f in TOP_FILES if (ROOT / f).exists()]
    # Templates hold links that only resolve once copied to their destination.
    return [f for f in files if "templates" not in f.relative_to(ROOT).parts]


def strip_code(lines: list[str]) -> list[tuple[int, str]]:
    """Return (line number, text) pairs with fenced blocks and inline code removed."""
    out = []
    in_fence = False
    for i, line in enumerate(lines, 1):
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        out.append((i, INLINE_CODE.sub("", line)))
    return out


def slugify(text: str) -> str:
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.strip().lower()
    text = re.sub(r"[^\w\- ]", "", text)
    return text.replace(" ", "-")


_anchor_cache: dict[Path, set[str]] = {}


def anchors(path: Path) -> set[str]:
    if path in _anchor_cache:
        return _anchor_cache[path]
    seen: dict[str, int] = {}
    result: set[str] = set()
    in_fence = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for a in HTML_ANCHOR.findall(line):
            result.add(a)
        m = HEADING.match(line)
        if not m:
            continue
        slug = slugify(m.group(2))
        n = seen.get(slug, 0)
        result.add(slug if n == 0 else f"{slug}-{n}")
        seen[slug] = n + 1
    _anchor_cache[path] = result
    return result


def check_target(src: Path, target: str) -> str | None:
    if re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I) or target.startswith("//"):
        return None  # external or mailto
    path_part, _, frag = target.partition("#")
    path_part = unquote(path_part)
    dest = src if not path_part else (src.parent / path_part).resolve()
    if not dest.exists():
        return f"missing target {path_part}"
    if frag:
        if dest.is_dir() or dest.suffix.lower() != ".md":
            return None
        if unquote(frag) not in anchors(dest):
            return f"missing anchor #{frag} in {dest.relative_to(ROOT)}"
    return None


def main() -> int:
    allow_missing = "--allow-missing" in sys.argv
    broken = 0
    pending: list[str] = []
    checked = 0
    for f in md_files():
        lines = f.read_text(encoding="utf-8").splitlines()
        for lineno, text in strip_code(lines):
            targets = INLINE_LINK.findall(text) + IMAGE_LINK.findall(text)
            m = REF_DEF.match(text)
            if m:
                targets.append(m.group(1))
            for t in targets:
                checked += 1
                err = check_target(f, t)
                if err and allow_missing and err.startswith("missing target"):
                    pending.append(f"{f.relative_to(ROOT)}:{lineno}: {t}")
                elif err:
                    broken += 1
                    print(f"{f.relative_to(ROOT)}:{lineno}: {t} -> {err}")
    if pending:
        print(f"{len(pending)} links point at files not written yet:")
        print("\n".join("  " + p for p in pending))
    print(f"checked {checked} links, {broken} broken")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
