# assets-src

High-resolution masters for assets that ship downscaled in `assets/`.

Nothing here is `require()`d, so Expo does not bundle it — it exists only so we
can re-export an optimized asset without re-acquiring the original.

- `backgrounds/2066-original.jpg` — 7826×4174 master. Shipped as
  `assets/backgrounds/2066.jpg` at 3037×1620 (~1.5x the 1080px share-card
  export in `ShareableResultScreen.tsx`). Re-derive with:
  `sips <master> --resampleHeight 1620 --setProperty formatOptions 90 --out assets/backgrounds/2066.jpg`
