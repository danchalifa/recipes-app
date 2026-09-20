#!/usr/bin/env python3
"""Stitch generated card images into one labelled grid for quick review.

Usage: python3 scripts/contact_sheet.py out.png [id ...]
With no ids, uses every .webp in public/recipe-images.
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "recipe-images"
COLS = 4
CELL_W = 320
CELL_H = 180
LABEL_H = 18

names = {
    str(r["RowID"]): (r.get("Name") or "")
    for r in json.loads((ROOT / "data" / "recipes.json").read_text())
}


def main():
    out = pathlib.Path(sys.argv[1])
    ids = sys.argv[2:]
    files = (
        [IMG_DIR / f"{i}.webp" for i in ids]
        if ids
        else sorted(IMG_DIR.glob("*.webp"), key=lambda p: int(p.stem))
    )
    files = [f for f in files if f.exists()]
    if not files:
        sys.exit("no images found")

    rows = (len(files) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * CELL_W, rows * (CELL_H + LABEL_H)), "white")
    draw = ImageDraw.Draw(sheet)

    for n, f in enumerate(files):
        col, row = n % COLS, n // COLS
        x, y = col * CELL_W, row * (CELL_H + LABEL_H)
        im = Image.open(f).convert("RGB").resize((CELL_W, CELL_H))
        sheet.paste(im, (x, y))
        label = f"{f.stem}  {names.get(f.stem, '')}"[:46]
        draw.text((x + 4, y + CELL_H + 4), label, fill="black")

    sheet.save(out)
    print(f"{len(files)} images -> {out}")


if __name__ == "__main__":
    main()
