# Extending Exercise Audio Settings

Companion to `exercise-audio-settings.md`. Read that first. This guide covers the **common extension paths** and the exact files you'd touch for each.

The whole system is designed around one principle: **the UI is a function of the registry**. If you can describe a new audio feature as data, the sheet renders it for free.

---

## 1. Add a new option inside an existing category

Example: add a "thunderstorm" ambient sound.

1. Drop the asset under `assets/audio/ambient/thunderstorm.m4a`.
2. Append to `src/features/audioSettings/catalog/ambient.ts`:

   ```ts
   {
     id: 'thunderstorm',
     label: 'Thunderstorm',
     asset: require('../../../../assets/audio/ambient/thunderstorm.m4a'),
   }
   ```

No screen, hook, or sheet edits needed. The row appears automatically and the existing `useAmbientAudio` hook will pick it up when selected.

**Gotchas:**
- `id` must be stable forever — it's persisted in AsyncStorage. Renaming it orphans existing users' selections.
- Keep file sizes reasonable (under ~500KB per loop). Long ambient files should be encoded as looping-friendly m4a.

---

## 2. Add a whole new category

Example: a "Coach phrases" category that speaks short motivational lines between rounds.

1. Create `src/features/audioSettings/catalog/coachPhrases.ts` with an `AudioCategory` export.
2. Append the new category to the `audioCategories` array in `registry.ts`.
3. Extend the `AudioPreferences` type in `types.ts`:

   ```ts
   interface AudioPreferences {
     voice: string | null;
     ambient: string | null;
     chime: string | null;
     coachPhrases: string | null;   // new
     ambientVolume: number;
   }
   ```

4. Add a default value for the new key in `preferences.ts` (default to `null`).
5. **Bump the storage key version**: `settings:audio_v1` → `settings:audio_v2`, and add a one-shot migration in `preferences.ts` that reads `_v1` and writes a `_v2` blob with the new field filled in. This is the only file where storage-shape changes belong.
6. Write a hook to consume it (e.g. `useCoachPhrases`) modeled after `useAmbientAudio` or `usePhaseChime` depending on whether it loops or fires on events.
7. Mount that hook inside `DailyExercisePage` / `ExerciseSessionPage` next to the existing audio hooks.

The sheet UI requires **zero changes** — it iterates `audioCategories`.

---

## 3. Add a non-audio section to the sheet (per-screen ephemeral state)

Some settings don't belong in the audio registry — they're per-screen ephemeral state (e.g. color theme, rounds count, "show heart rate" toggle). For these, use the sheet's `extraSectionsTop` slot.

The sheet exposes:

```ts
interface AudioSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;             // defaults to "Settings"
  extraSectionsTop?: ReactNode;
}
```

Anything passed to `extraSectionsTop` renders above the audio categories inside the scroll view. Build a section component that matches the visual language of `AudioSettingsRow` (rounded row, optional checkmark, semibold label) and pass it from the screen.

Existing example: `ThemePickerSection` — the exercise color theme lives in screen-local `useState`, not in `AudioPreferences`, because each screen owns its own theme. The screen passes it in:

```tsx
<AudioSettingsSheet
  visible={open}
  onClose={() => setOpen(false)}
  extraSectionsTop={
    <ThemePickerSection
      activeThemeId={activeTheme.id}
      onSelect={setActiveTheme}
    />
  }
/>
```

**When to use `extraSectionsTop` vs. a new audio category:**
- Audio category — the value is global, persisted across sessions/devices, and the user expects it to survive app restarts. Belongs in the registry.
- `extraSectionsTop` — value is per-screen, ephemeral, or session-only. Lives in `useState` on the screen, not in `AudioPreferences`.

**Conventions for extra sections:**
- Build them as standalone components in `src/features/audioSettings/` so they're discoverable next to the sheet.
- Re-use spacing/typography/card tokens — match `ThemePickerSection`'s layout so sections feel uniform.
- Don't touch `preferences.ts` — that file is for persisted audio state only.
- If a setting starts as ephemeral and later needs persistence, promote it to a real audio category (or a separate preferences module) rather than smuggling persistence into the section component.

## 4. Add a non-list control to a category (slider, toggle, multi-select)

Today only ambient has a volume slider, hard-coded under its section. When a second category needs an extra control, generalize instead of duplicating:

1. Add an optional `extraControls?: AudioCategoryControl[]` field to `AudioCategory`.
2. Define a small discriminated union:

   ```ts
   type AudioCategoryControl =
     | { kind: 'slider'; id: string; label: string; min: number; max: number; step: number }
     | { kind: 'toggle'; id: string; label: string };
   ```

3. Render them in `AudioSettingsSheet` below the option list via a `switch` on `kind`.
4. Add a corresponding field to `AudioPreferences` and bump the storage key (see §2 step 5).

Avoid doing this proactively — wait until you actually have a second use case. One inline slider is fine; a generic engine for one slider is overkill.

---

## 5. Gate an option behind Pro / a feature flag

The registry entry already has an optional `premium?: boolean` flag. To honor it:

1. In `AudioSettingsRow.tsx`, when `option.premium && !hasPro`, render a lock badge and on tap route to `ProPaywallScreen` instead of selecting.
2. In `preferences.ts`, guard `setSelection`: if the chosen option is premium and the user lacks access, refuse the write. Belt-and-suspenders so a stale selection can't survive a subscription expiry.
3. Use `useFeatureAccess` (already in `src/hooks/`) for the Pro check.

Same pattern works for experiment flags — swap the predicate.

---

## 6. Per-technique overrides (when YAGNI ends)

The current design is global by intent. If overrides become real:

1. Extend storage shape:

   ```ts
   interface AudioPreferences { /* global defaults */ }
   interface AudioOverrides { [techniqueId: string]: Partial<AudioPreferences> }
   ```

2. Add a resolver: `getEffectiveAudioPrefs(techniqueId): AudioPreferences` that merges overrides over defaults.
3. The hooks switch from `useAudioPreferences()` to `useEffectiveAudioPrefs(techniqueId)`.
4. The sheet grows a "Apply to: This exercise / All exercises" toggle at the top.

Migration is straightforward because the resolver is the only new boundary; consuming hooks don't care where the values came from.

---

## 7. Cloud-sync the preferences

The singleton in `preferences.ts` is the only place that touches storage. To sync:

1. Define a thin `PreferencesBackend` interface (`load`, `save`).
2. Have the singleton accept the backend via DI. Default = AsyncStorage. Sync build = a backend that writes to AsyncStorage *and* Supabase, with last-write-wins reconciliation on `load`.
3. Nothing else changes. The hook, the sheet, the consuming hooks all stay identical.

Don't do this until at least one user asks for cross-device sync.

---

## 8. Add a custom user-uploaded sound

Significantly more work — not a registry tweak. You'd need:

- File picker (`expo-document-picker`) + audio validation
- Local file persistence under `FileSystem.documentDirectory + 'audio/'`
- A new `AudioOptionSource` variant: `{ kind: 'bundled', asset } | { kind: 'userFile', uri }`
- Update `useAmbientAudio` / `useBreathPhaseAudio` to accept either shape (expo-audio takes a uri object the same way as a `require()`)
- A "+ Add your own" pseudo-row in the relevant category

Scope this as its own feature, not a side dish to a new option.

---

## Conventions to keep the system honest

- **Never hardcode an audio path inside a hook or screen.** Hooks read selection IDs from preferences and resolve the asset via the registry. The registry is the only place `require('...audio...')` should appear.
- **`id` is forever.** Treat it like a database primary key. Add new IDs freely, never rename existing ones.
- **Bump the storage version key when changing the persisted shape.** Migrations live in `preferences.ts` and nowhere else.
- **No new theme tokens for a one-off UI tweak.** If you find yourself reaching for an unusual color/shadow inside the sheet, check `card.ts`, `colors.ts` first.
- **Hooks must be no-ops when their preference is `null`.** That's the contract that lets users turn anything off without the consuming screen knowing.
- **Preview path must be the same code path as playback.** If preview uses a different player than the real session, you'll ship bugs that only appear during real sessions.

---

## Quick reference: which file do I touch?

| Change                                  | File(s)                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| Add an option to an existing category   | `catalog/<category>.ts` only                             |
| Add a new category                      | `catalog/<new>.ts`, `registry.ts`, `types.ts`, `preferences.ts`, new hook, mount in 2 screens |
| Add a non-audio section (per-screen)    | New component in `src/features/audioSettings/`, pass via `extraSectionsTop` on the sheet |
| Add a non-list control                  | `types.ts`, `registry.ts`, `AudioSettingsSheet.tsx`, `preferences.ts` |
| Gate behind Pro                         | `AudioSettingsRow.tsx`, `preferences.ts`                 |
| Per-technique overrides                 | `preferences.ts` (resolver), hook signatures             |
| Cloud sync                              | `preferences.ts` (backend DI) only                       |
| User-uploaded audio                     | New feature scope; touches catalog source type + hooks   |
