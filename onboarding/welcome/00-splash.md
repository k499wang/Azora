# Screen 0 — Splash

## Purpose

Open the app with a single, calm, high-trust frame. Get out of the way fast.

## What the user sees

- Full-bleed solid background in the warm welcome surface color (soft cream / off-white, NOT pure white — pure white reads sterile).
- App logo, centered, ~25% of screen height.
- Nothing else. No tagline. No spinner. No version number. No "from the makers of…".

## Behavior

- Holds for ~600ms after fonts and theme are ready.
- Cross-fades into Screen 1 (Breathe in) over ~250ms. The blob from Screen 1 should fade up *underneath* the logo as the logo fades out, so there's no blank frame.
- If the user has an existing session, splash skips the entire welcome flow and goes to Home.

## Copy

None.

## Why this screen exists

A splash is an unavoidable artifact of native app cold-start. The choice is whether to use it as a brand stage (Calm, Strava) or to compress it (Hims & Hers, Apple Health). For a wellness/health hybrid, compression is correct: the user opened this app because they feel something *now*, and a five-second logo reveal raises their cortisol, not lowers it.

## Tips applied

- **Minimal splash with fast transition to value** — the entire purpose of the screen. ~600ms hold, no decoration, no marketing.
- **Cognitive load reduction** — one element on screen.
- **Health-app seriousness** — refusing to use the splash as a marketing stage signals the app is a tool, not entertainment.

## Tips deliberately *not* applied here

- No social proof, no value prop copy. Those come later. The splash is a transition surface, not a sell.

## Implementation hints (for the eventual coder)

- Already partially handled in `App.tsx` (font loading + splash). Extend, don't replace.
- Use `expo-splash-screen` to keep the native splash visible until fonts load, then mount the React splash with the same background color so there's no flash.
- Background color belongs in `colors.ts` as e.g. `colors.surface.welcome` — add it if missing.
