# Heart-rate plugin snapshot — 2026-04-24

Saved copies of `HeartRatePlugin.{swift,m,mm}` **as they existed in `ios/`
before the bundle-id rename and `expo prebuild --clean`**, i.e. the older
version that used a 300×300 center-crop before sampling ROIs.

## Why this is here

The newer version in `native/ios/HeartRatePlugin.{swift,mm}` dropped the
center-crop and now samples ROIs against the full camera frame. This is
expected to improve PPG signal quality (uses ~20× more pixel data) but
has not yet been on-device verified against a reference heart-rate source.

If the new version regresses BPM accuracy or introduces edge-noise
artifacts, these files are the rollback target.

## How to restore

```bash
cp native/_archive-2026-04-24/ios/HeartRatePlugin.swift native/ios/
cp native/_archive-2026-04-24/ios/HeartRatePlugin.mm    native/ios/
npx expo prebuild --clean
npx expo run:ios
```

## Location rationale

This folder lives **outside** `native/ios/` on purpose. The
`with-heart-rate-plugin` config plugin at `plugins/with-heart-rate-plugin.js`
recursively copies everything under `native/ios/` into the generated `ios/`
folder on prebuild. Keeping archived copies there would ship duplicate
Swift class declarations into the Xcode project. Placing them under
`native/` (but not `native/ios/`) keeps them safely out of the plugin's
scan path.

Safe to delete once the new plugin version has been on-device verified
and any drift re-baselined.
