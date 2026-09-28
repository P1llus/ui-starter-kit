"""Image helpers: tiling tall shots, contact sheets, blank detection, before/after diffs.

Contact sheets are for overview and cross-page comparison (headers side by side, light next
to dark). They never replace opening the full-size PNG before reporting a finding.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

MAX_TILE_H = 1800


def tile_if_tall(path: Path, max_h: int = MAX_TILE_H) -> list[Path]:
    """Split an image taller than `max_h` into numbered tiles, so a viewer does not shrink it
    until the text is unreadable. Returns the files to use."""
    with Image.open(path) as im:
        w, h = im.size
        if h <= max_h:
            return [path]
        tiles = []
        overlap = 80
        top, n = 0, 1
        while top < h:
            bottom = min(h, top + max_h)
            tile = path.with_name(f"{path.stem}.{n}{path.suffix}")
            im.crop((0, top, w, bottom)).save(tile)
            tiles.append(tile)
            if bottom == h:
                break
            top, n = bottom - overlap, n + 1
    path.unlink()
    return tiles


def is_blank(path: Path) -> bool:
    """True when the image is (nearly) one flat colour: a render that did not load."""
    with Image.open(path) as im:
        stat = ImageStat.Stat(im.convert("L"))
        return stat.stddev[0] < 3


def _font(size: int):
    for name in ("DejaVuSans.ttf", "Arial.ttf", "Helvetica.ttc"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def contact_sheets(files: list[Path], out_dir: Path, per_sheet: int = 6, cell_w: int = 720, pair_dark: bool = True) -> list[Path]:
    """Grids of captioned thumbnails. With pair_dark, `x.png` and `x-dark.png` share a row."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("sheet-*.png"):  # a shorter run must not leave sheets from a longer one
        old.unlink()
    rows: list[list[Path]] = []
    if pair_dark:
        by_stem = {f.stem: f for f in files}
        used = set()
        for f in files:
            if f in used or f.stem.endswith("-dark") and f.stem[:-5] in by_stem:
                continue
            dark = by_stem.get(f"{f.stem}-dark")
            rows.append([f, dark] if dark else [f])
            used.update([f, dark] if dark else [f])
        cols = 2
        per_rows = max(1, per_sheet // 2)
    else:
        cols = 2
        rows = [files[i : i + cols] for i in range(0, len(files), cols)]
        per_rows = max(1, per_sheet // cols)
    font = _font(15)
    sheets = []
    for s in range(0, len(rows), per_rows):
        chunk = rows[s : s + per_rows]
        thumbs = []
        for row in chunk:
            cells = []
            for f in row:
                with Image.open(f) as im:
                    im = im.convert("RGB")
                    ratio = cell_w / im.width
                    cells.append((f.name, im.resize((cell_w, max(1, int(im.height * ratio))))))
            thumbs.append(cells)
        cap_h = 24
        row_hs = [max(c[1].height for c in cells) + cap_h for cells in thumbs]
        sheet = Image.new("RGB", (cols * cell_w + (cols + 1) * 12, sum(row_hs) + (len(thumbs) + 1) * 12), "#2b2f36")
        draw = ImageDraw.Draw(sheet)
        y = 12
        for cells, rh in zip(thumbs, row_hs):
            x = 12
            for name, im in cells:
                draw.text((x, y + 2), name, fill="#e6e9ef", font=font)
                sheet.paste(im, (x, y + cap_h))
                x += cell_w + 12
            y += rh + 12
        path = out_dir / f"sheet-{len(sheets) + 1:02d}.png"
        sheet.save(path)
        sheets.append(path)
    return sheets


def diff(before: Path, after: Path, out: Path, threshold: int = 24) -> float:
    """Writes `after` with every changed pixel marked red to `out`, at full size, and returns
    the share of changed pixels (0-100). Open `before` and `after` themselves to compare."""
    with Image.open(before) as a, Image.open(after) as b:
        a, b = a.convert("RGB"), b.convert("RGB")
        if a.size != b.size:
            a = a.resize(b.size)
        delta = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > threshold else 0)
        changed = sum(delta.histogram()[255:]) / (b.width * b.height) * 100
        marked = Image.blend(b, Image.new("RGB", b.size, "#ffffff"), 0.55)
        marked.paste(Image.new("RGB", b.size, "#ff2d55"), mask=delta)
        out.parent.mkdir(parents=True, exist_ok=True)
        marked.save(out)
    return changed
