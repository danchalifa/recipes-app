#!/usr/bin/env python3
"""Stitch the category tile banners into one labelled sheet for review.

Usage: python3 scripts/category_sheet.py out.png
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "category-images"
COLS = 2
CELL_W = 460
CELL_H = 160
LABEL_H = 18

names = {
    str(c["CatID"]): c["Type"]
    for c in json.loads((ROOT / "data" / "categories.json").read_text())
}


def main():
    out = pathlib.Path(sys.argv[1])
    files = sorted(IMG_DIR.glob("*.webp"), key=lambda p: int(p.stem))
    rows = (len(files) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * CELL_W, rows * (CELL_H + LABEL_H)), "white")
    draw = ImageDraw.Draw(sheet)

    for n, f in enumerate(files):
        col, row = n % COLS, n // COLS
        x, y = col * CELL_W, row * (CELL_H + LABEL_H)
        sheet.paste(Image.open(f).convert("RGB").resize((CELL_W, CELL_H)), (x, y))
        draw.text((x + 4, y + CELL_H + 4), f"{f.stem}  {names.get(f.stem, '')}", fill="black")

    sheet.save(out)
    print(f"{len(files)} images -> {out}")


if __name__ == "__main__":
    main()
