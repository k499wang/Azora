# assets

One folder per role, so a new file has an obvious home and a dead one is
obvious too. Nothing here is loaded by name at runtime — every image is a
literal `require()`, which is what lets an unreferenced file be found and
deleted.

- `app/` — what `app.config.js` ships to the store: icon, adaptive icon,
  favicon, splash. Named for the slot they fill, not the art in them.
- `animations/` — Lottie.
- `audio/` — chimes, ambience and voice cues, all 48 kHz.
- `backgrounds/` — full-bleed art a screen picks by id via `backgroundAssets.ts`.
- `brand/` — the wordmark and the signature.
- `exercises/` — one image per guided technique, wired in `techniques.ts`.
- `heroes/` — the four tab headers, named after their tab.
- `logos/` — third-party marks used as credibility proof.
- `mascot/` — Mochi's shots, and the blob cat art `BlobCat.tsx` was traced from.
- `onboarding/` — art only onboarding shows, including its `questions/`.
- `testimonials/` — the faces beside quotes.

High-resolution masters live in `assets-src/`, which Expo does not bundle.

Feature-owned art that no other feature can use stays with its feature — see
`src/features/garden/assets/plants/`.
