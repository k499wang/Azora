# Image Asset Optimization

Bundled images should be sized for their actual render target. Card backgrounds render at ~400pt @ 3x ≈ 1200px max, so source images above ~1000px wide are wasted bytes that bloat the binary and memory at decode time.

**Target:** ≤ 1000px on the long edge, JPEG quality ~75, under ~250 KB each.

## Check sizes

List file sizes in a folder:

```sh
ls -lh assets/exercises/
```

Sort largest first across the whole assets tree:

```sh
find assets -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec du -h {} + | sort -hr | head -20
```

## Resize + recompress in place

macOS only — uses built-in `sips`. Run from the folder containing the images:

```sh
setopt NULL_GLOB
for f in *.jpg *.jpeg *.png; do
  [ -f "$f" ] || continue
  sips -Z 1000 -s format jpeg -s formatOptions 75 "$f" --out "${f%.*}.tmp.jpg" >/dev/null \
    && mv "${f%.*}.tmp.jpg" "${f%.*}.jpg"
done
```

Flags:
- `-Z 1000` — resize so the longest edge is 1000px, preserving aspect ratio (only shrinks, never enlarges).
- `-s format jpeg` — re-encode as JPEG (also converts PNG → JPEG; drop this if you need transparency).
- `-s formatOptions 75` — JPEG quality 0–100. 75 is a good photo default; bump to 85 if you see artifacts.

The `tmp` dance avoids `sips` corrupting the source when input and output paths match.
