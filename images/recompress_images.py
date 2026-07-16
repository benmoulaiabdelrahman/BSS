#!/usr/bin/env python3
"""
Run this ONCE inside your `images/` folder, AFTER resize_images.py:

    python3 recompress_images.py

This re-saves each ORIGINAL image (same width/height, nothing about layout
or srcset changes) at a slightly more efficient WebP quality setting.
Lighthouse's "Improve image delivery" audit flags this as a separate,
additive saving on top of resizing - it matters because on high pixel
density phones the browser picks the full-size srcset candidate anyway
(to stay sharp), so shrinking the *file* itself is the only way to save
bytes for those cases.

Originals are backed up to images/_originals_backup/ before being
overwritten, so you can always revert if a particular photo looks off.

Requires: pip install Pillow --break-system-packages
"""

import os
import shutil
from PIL import Image

QUALITY = 80          # visually near-lossless for photos at this quality
BACKUP_DIR = "_originals_backup"
SKIP_SUFFIXES = ("-sm.webp",)  # the resize_images.py output is already recompressed

def should_process(fname):
    if not fname.lower().endswith(".webp"):
        return False
    if fname.endswith(SKIP_SUFFIXES):
        return False
    return True

def main():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    total_before = total_after = 0
    count = 0

    for fname in sorted(os.listdir(".")):
        if not should_process(fname):
            continue

        backup_path = os.path.join(BACKUP_DIR, fname)
        if not os.path.exists(backup_path):
            shutil.copy2(fname, backup_path)

        before = os.path.getsize(fname)
        with Image.open(backup_path) as im:  # always re-encode from the untouched backup
            im = im.convert("RGB") if im.mode == "P" else im
            im.save(fname, "WEBP", quality=QUALITY, method=6)
        after = os.path.getsize(fname)

        if after < before:
            total_before += before
            total_after += after
            count += 1
            print(f"{fname:35s} {before/1024:6.1f} KiB -> {after/1024:6.1f} KiB")
        else:
            # recompression didn't help (rare) - restore the original
            shutil.copy2(backup_path, fname)

    if count:
        print(f"\n{count} files recompressed. {total_before/1024:.0f} KiB -> {total_after/1024:.0f} KiB "
              f"({(1 - total_after/total_before)*100:.0f}% smaller)")
        print(f"Originals backed up in ./{BACKUP_DIR}/ - delete that folder once you've confirmed everything looks right.")
    else:
        print("Nothing to do.")

if __name__ == "__main__":
    main()
