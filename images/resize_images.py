#!/usr/bin/env python3
"""
Run this ONCE inside your `images/` folder:

    python3 resize_images.py

For every menu photo (the ones displayed at ~190-240px but currently saved
at 500x500) it creates a "-sm.webp" sibling file at 320px wide, recompressed
a bit harder. Originals are left untouched, so nothing breaks and nothing
about the site's look changes - the new index.html just prefers the small
file via srcset when the display size is small, and falls back to the
original for very large / high-density screens.

Requires: pip install Pillow --break-system-packages
"""

import os
from PIL import Image

# Images that are displayed small (menu grid / slider) - the ones flagged
# by Lighthouse as "properly size images". Add/remove names as needed.
TARGET_WIDTH = 320
QUALITY = 78

SKIP_SUFFIXES = ("-sm.webp",)  # don't re-process our own output

def should_process(fname):
    if not fname.lower().endswith(".webp"):
        return False
    if fname.endswith(SKIP_SUFFIXES):
        return False
    return True

def make_small(path):
    base, ext = os.path.splitext(path)
    out_path = f"{base}-sm{ext}"
    if os.path.exists(out_path):
        return None  # already generated
    with Image.open(path) as im:
        w, h = im.size
        if w <= TARGET_WIDTH:
            return None  # already small enough, skip
        new_h = round(h * (TARGET_WIDTH / w))
        im = im.convert("RGB") if im.mode in ("P",) else im
        resized = im.resize((TARGET_WIDTH, new_h), Image.LANCZOS)
        resized.save(out_path, "WEBP", quality=QUALITY, method=6)
    before = os.path.getsize(path)
    after = os.path.getsize(out_path)
    return before, after

def main():
    total_before = total_after = 0
    count = 0
    for fname in sorted(os.listdir(".")):
        if not should_process(fname):
            continue
        result = make_small(fname)
        if result:
            before, after = result
            total_before += before
            total_after += after
            count += 1
            print(f"{fname:35s} {before/1024:6.1f} KiB -> {os.path.splitext(fname)[0]}-sm.webp {after/1024:6.1f} KiB")

    if count:
        print(f"\n{count} files processed. {total_before/1024:.0f} KiB -> {total_after/1024:.0f} KiB "
              f"({(1 - total_after/total_before)*100:.0f}% smaller)")
    else:
        print("Nothing to do (either no .webp files here, or -sm.webp versions already exist).")

if __name__ == "__main__":
    main()
