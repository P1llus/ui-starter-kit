"""Render HTML design canvases to one PNG per board, plus an index and a gallery page.

Two uses:
- The design boards drawn in step 2 (design/boards/*.html, default).
- Design exports the user brought (Claude Design canvases, HTML mockups), collected in input/.

    uv run python render_boards.py                                  # design/boards -> design/png (orchestrator)
    uv run python render_boards.py ../design/boards/03-components-data.html --out ../work/sessions/<task-id>/png  # board agents
    uv run python render_boards.py ../input --out ../work/intake/renders --sheet

A canvas holds boards as `section.board` (or any `[data-board]`) elements. Each board's `.frame`
(or the board itself) becomes <out>/<canvas>/<board>.png, named by `data-board` or its number.
Captions come from `data-caption`, `.board-caption` or the first heading. A file without boards
is shot as one full page (split into tiles when tall). Boards that are script-filled iframes,
as in exported canvases, are waited for until they have content.

Every PNG is checked for a blank render (one flat colour); blanks are retried with a longer
wait and listed at the end. Writes <out>/index.md, <out>/index.tsv and <out>/gallery.html
(open it in a browser to show the user every board with its caption).
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

from uitools.chrome import launch
from uitools.images import contact_sheets, is_blank, tile_if_tall

REPO = Path(__file__).resolve().parent.parent

BOARDS_JS = "() => [...document.querySelectorAll('section.board, [data-board]')].filter((el, i, all) => !all.some(o => o !== el && o.contains(el)))"


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60] or "canvas"


def wait_for_content(page, extra_ms: int) -> None:
    """Exported canvases fill their board iframes by script; wait until each has text."""
    for _ in range(60):
        pending = page.evaluate(
            """() => [...document.querySelectorAll('section.board iframe, [data-board] iframe')].filter(f => {
                try { const b = f.contentDocument && f.contentDocument.body; return !b || b.innerText.trim().length < 20; }
                catch (e) { return false; }
            }).length"""
        )
        if not pending:
            break
        page.wait_for_timeout(500)
    try:
        page.evaluate("() => document.fonts ? document.fonts.ready.then(() => true) : true")
    except Exception:
        pass
    page.wait_for_timeout(extra_ms)


def render_file(browser, src: Path, out: Path, width: int, extra_ms: int, canvas: str) -> list[dict]:
    rows: list[dict] = []
    folder = out / canvas
    folder.mkdir(parents=True, exist_ok=True)
    for attempt, wait in enumerate((extra_ms, extra_ms * 4), 1):
        page = browser.new_page(viewport={"width": width, "height": 1000}, device_scale_factor=1)
        page.goto(src.resolve().as_uri(), wait_until="load", timeout=90000)
        wait_for_content(page, wait)
        title = page.title() or src.stem
        boards = page.evaluate_handle(BOARDS_JS)
        count = page.evaluate("(list) => list.length", boards)
        rows = []
        if count == 0:
            path = folder / "page.png"
            page.screenshot(path=str(path), full_page=True)
            for f in tile_if_tall(path):
                rows.append({"canvas": canvas, "title": title, "board": f.stem, "caption": title, "file": f})
        for i in range(count):
            el = page.evaluate_handle("([list, i]) => list[i]", [boards, i])
            info = page.evaluate(
                """(el) => {
                    const cap = el.getAttribute('data-caption')
                      || (el.querySelector('.board-caption, h1, h2, h3, .caption, header') || {}).innerText || '';
                    return { id: el.getAttribute('data-board') || '', caption: cap.split('\\n')[0].trim().slice(0, 200),
                             theme: el.getAttribute('data-theme') || '' };
                }""",
                el,
            )
            frame = el.as_element().query_selector(":scope > .frame") or el.as_element()
            frame.scroll_into_view_if_needed()
            name = slug(info["id"]) if info["id"] else f"{i + 1:02d}"
            path = folder / f"{name}.png"
            frame.screenshot(path=str(path))
            for f in tile_if_tall(path):
                rows.append({"canvas": canvas, "title": title, "board": f.stem, "caption": info["caption"], "file": f})
        page.close()
        blanks = [r for r in rows if is_blank(r["file"])]
        if not blanks or attempt == 2:
            for r in rows:
                r["blank"] = r in blanks
            break
        print(f"  {len(blanks)} blank board(s) in {src.name}, rendering again with a longer wait")
    print(f"{src.name}: {len(rows)} image(s)")
    return rows


def write_outputs(rows: list[dict], out: Path) -> None:
    rel = lambda p: p.relative_to(out).as_posix()  # noqa: E731
    with open(out / "index.tsv", "w", encoding="utf8") as f:
        f.write("canvas\tboard\tcaption\tpng\tblank\n")
        for r in rows:
            f.write(f"{r['canvas']}\t{r['board']}\t{r['caption']}\t{rel(r['file'])}\t{r.get('blank', False)}\n")
    md = ["# Rendered boards", "", "| Canvas | Board | Caption | PNG |", "| --- | --- | --- | --- |"]
    md += [f"| {r['canvas']} | {r['board']} | {r['caption'].replace('|', '/')} | {rel(r['file'])}"
           f"{' (BLANK)' if r.get('blank') else ''} |" for r in rows]
    (out / "index.md").write_text("\n".join(md) + "\n")
    sections, current = [], None
    for r in rows:
        if r["canvas"] != current:
            current = r["canvas"]
            sections.append(f"<h2>{html.escape(r['title'])} <small>{html.escape(current)}</small></h2>")
        sections.append(
            f"<figure><img src='{rel(r['file'])}' loading='lazy'><figcaption><b>{html.escape(r['board'])}</b> "
            f"{html.escape(r['caption'])}</figcaption></figure>"
        )
    (out / "gallery.html").write_text(
        "<!doctype html><meta charset='utf-8'><title>Boards</title><style>"
        "body{font:14px/1.5 system-ui,sans-serif;background:#1f232a;color:#e6e9ef;margin:0;padding:24px 32px}"
        "h2{margin:48px 0 12px;font-size:20px}small{color:#8b95a7;font-weight:400;margin-left:8px}"
        "figure{margin:0 0 32px}img{max-width:100%;border:1px solid #3a404b;display:block}"
        "figcaption{margin-top:6px;color:#c3cad6}</style>"
        f"<h1>Boards</h1><p>{len(rows)} images. Open a PNG at full size to judge details.</p>"
        + "\n".join(sections)
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", help="HTML files or folders (default: design/boards)")
    ap.add_argument("--out", help="output folder (default: design/png)")
    ap.add_argument("--width", type=int, default=1800, help="viewport width; boards keep their own size")
    ap.add_argument("--wait", type=int, default=800, help="ms to wait after content loads")
    ap.add_argument("--sheet", action="store_true", help="also write contact sheets to <out>/sheets/")
    args = ap.parse_args()

    paths = [Path(p) for p in args.paths] or [REPO / "design" / "boards"]
    files: list[tuple[Path, str]] = []  # (file, output folder name)
    for p in paths:
        if p.is_dir():
            for f in sorted(p.rglob("*.htm*")):
                if not f.name.startswith("_") and not f.name.endswith(".md.html"):
                    # Name by the path below the folder, so a/index.html and b/index.html don't collide.
                    files.append((f, slug(f.relative_to(p).with_suffix("").as_posix())))
        elif p.suffix.lower() in (".html", ".htm"):
            files.append((p, slug(p.stem)))
    if not files:
        print("no HTML files found; nothing to render")
        return 0
    out = Path(args.out) if args.out else REPO / "design" / "png"
    out.mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []
    failed: list[Path] = []
    with sync_playwright() as p:
        browser = launch(p)
        for f, canvas in files:
            try:
                rows += render_file(browser, f, out, args.width, args.wait, canvas)
            except Exception as exc:
                failed.append(f)
                print(f"FAILED {f}: {str(exc).splitlines()[0]}")
        browser.close()
    write_outputs(rows, out)
    blanks = [r for r in rows if r.get("blank")]
    if args.sheet and rows:
        sheets = contact_sheets([r["file"] for r in rows], out / "sheets", pair_dark=False)
        print(f"{len(sheets)} contact sheets in {out / 'sheets'}")
    print(f"{len(rows)} images in {out}; index {out / 'index.md'}; gallery {out / 'gallery.html'}")
    if blanks:
        print("BLANK renders (look at the source HTML):")
        for r in blanks:
            print(f"  {r['file']}")
    return 1 if blanks or failed else 0


if __name__ == "__main__":
    sys.exit(main())
