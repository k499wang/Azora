# Plan: Exercise Audio Settings (modular & extensible)

Status: proposed
Owner: kevin
Date: 2026-05-14

## Decisions locked in
- **Entry:** gear icon in `AppTopBar` `rightSlot` on `DailyExercisePage` + `ExerciseSessionPage`, opens a bottom-sheet modal.
- **Scope:** global preferences shared across all exercises.
- **v1 features:** voice cues (inhale/exhale/hold), background sounds, phase chimes.
- **Persistence:** AsyncStorage, mirroring the existing `services/preferences/hapticsPreference.ts` pattern (singleton + load/get/set + hook).

## Core idea: a tiny **registry** of audio "tracks"

Each user-facing audio feature (voice pack, ambient sound, chime set) is just a data entry. The settings UI **iterates the registry** instead of hard-coding rows. Adding a new feature = drop a file + register it. No screen edits needed.

```
src/
  features/
    audioSettings/
      types.ts            // AudioCategoryId, AudioOptionId, AudioPreferences
      registry.ts         // categories[] -> options[] (declarative manifest)
      catalog/
        voices.ts         // [{ id: 'calm-female', label, asset, premium? }, ...]
        ambient.ts        // [{ id: 'rain', label, asset, loop: true }, ...]
        chimes.ts         // [{ id: 'bell', label, asset }, ...]
      preferences.ts      // singleton load/get/set (parallel to hapticsPreference.ts)
      useAudioPreferences.ts  // hook (parallel to useHapticsPreference)
      AudioSettingsSheet.tsx  // bottom-sheet UI driven by registry
      AudioSettingsRow.tsx    // one selectable row + preview button
      SettingsGearButton.tsx  // the gear icon for AppTopBar rightSlot
  hooks/
    useAmbientAudio.ts        // plays selected ambient loop while session active
    usePhaseChime.ts          // fires chime on phase change
    useBreathPhaseAudio.ts    // EXTEND to honor the selected voice pack
```

### `registry.ts` shape (the extensibility hinge)

```ts
export type AudioCategoryId = 'voice' | 'ambient' | 'chime';

export interface AudioOption {
  id: string;
  label: string;
  asset: number | null;          // require(...) or null = "Off"
  premium?: boolean;
}

export interface AudioCategory {
  id: AudioCategoryId;
  title: string;                 // "Voice cues"
  description: string;           // sheet subheader
  allowOff: boolean;             // adds an "Off" pseudo-option
  options: AudioOption[];
  previewable: boolean;          // shows preview button per row
}

export const audioCategories: AudioCategory[] = [voiceCategory, ambientCategory, chimeCategory];
```

Adding a 4th category later (e.g. "Coach phrases") = append one entry. The sheet renders it automatically.

### `AudioPreferences` & persistence

```ts
interface AudioPreferences {
  voice: string | null;     // null = Off
  ambient: string | null;
  chime: string | null;
  ambientVolume: number;    // 0..1 (future: per-category volume)
}
```

Stored as a single JSON blob under `settings:audio_v1`. Versioning the key now (`_v1`) saves pain later. Same singleton-cache + hook pattern as `hapticsPreference.ts` so the codebase stays uniform.

## UI/UX

**Gear button:** small circular pressable in `AppTopBar` `rightSlot` (custom icon added to `paths.ts`: `settings`). Tapping opens `AudioSettingsSheet`.

**Bottom sheet** (modal, snap to ~75% height):
- Header: "Audio" + close X
- One **section per registry category**, rendered via `.map()`:
  - Section title + short description
  - List of `AudioSettingsRow`s — checkmark on selected, preview button on each
  - "Off" row prepended if `allowOff`
- Ambient section has a slim volume slider below the list (single inline extension since only ambient needs it for now)
- Footer: "Reset to defaults"

**Why this UX:** one place, scannable, every category looks identical, preview-before-commit is essential for audio. No nested screens, no buried settings.

**Component:** `@gorhom/bottom-sheet` if not already installed; otherwise a plain `Modal` with `presentationStyle="formSheet"`. Check before assuming — fewer deps wins.

## Runtime wiring

- `useBreathPhaseAudio` reads the selected voice pack from `useAudioPreferences()` and chooses the asset accordingly. Falls back to current bell/bowl when voice is null. Existing fade/ramp logic is untouched.
- `useAmbientAudio({ active })` — new hook, mirrors the structure of `useBreathPhaseAudio` (expo-audio, looped, fade in/out on mount/unmount, AppState aware).
- `usePhaseChime(phase)` — one-shot, fires on phase edge.
- `DailyExercisePage` and `ExerciseSessionPage` each call these three hooks with `active` tied to session state. Each hook is a no-op when its preference is null.

## Definition of done for v1
- Gear icon on both exercise screens opens the sheet.
- Three categories render from the registry; selecting + previewing works.
- Selection persists across app restarts.
- Existing breath audio still works (regression check), respects voice override when set.
- `npx tsc --noEmit` clean. Android shadow tokens used for the gear button + sheet header.

## What I'd defer (and why)
- Per-technique overrides → YAGNI until users ask.
- Cloud sync → AsyncStorage is enough; the singleton boundary makes a sync adapter trivial later.
- Custom user uploads → big native scope, not in v1.
- TTS-generated voices → bundle real audio files for v1; the registry's `asset` field already permits swapping to a TTS resolver later without UI changes.

## Implementation order (reviewable slices)
1. `types.ts` + `registry.ts` + empty catalog files + `preferences.ts` + hook
2. `AudioSettingsSheet` + `SettingsGearButton`, wired into both screens (still no actual audio behavior change)
3. `useAmbientAudio` + `usePhaseChime` + voice-pack hook-up in `useBreathPhaseAudio`
