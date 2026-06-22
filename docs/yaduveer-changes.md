# Yaduveer Changes — Build Plan

Plan for the agreed product direction: an AI daily check-in that recommends a breathing
exercise, a pranayama library with English names, and Yaduveer as the coaching voice
(video demos + voiceovers) layered over the exercises.

This is the canonical plan. Update it as steps land.

---

## Agreed direction (source of truth)

- **AI coach = daily check-in.** Stress / energy / sleep / mood inputs + an in-app heart
  rate reading → a personalized breathing recommendation for that moment.
  - Accepted caveats: AI recs won't always be precise; API costs scale with usage.
- **Yaduveer = the voice inside Azora**, not the brand. Video demos + voiceovers layered
  over exercises. Azora stays its own product; branding may increase later depending on trial.
- **Build now:** breathing library + pranayama (English names, traditions intact),
  exercise guidance with his videos (doubling as guided meditations), immersive
  visuals & sounds.
- **Deferred (do not build yet):** smartwatch integration, structured journeys, community,
  sleep section, emotional-healing section, live sessions, standalone educational lessons.

### Deliverables owed by Yaduveer (gating items)
1. Video demos for each exercise he wants in the app.
2. Voiceovers to guide users through them.
3. Detailed written instructions for each of the 10 techniques.

### The 10 techniques
| # | English name | Traditional name |
|---|---|---|
| 1 | Alternate Nostril Breathing | Nadi Shodhana |
| 2 | Humming Bee Breath | Bhramari |
| 3 | Ocean Breath | Ujjayi |
| 4 | Left Nostril Breathing | Chandra Bhedana |
| 5 | Right Nostril Breathing | Surya Bhedana |
| 6 | Cooling Breath | Sheetali |
| 7 | Hissing Cooling Breath | Sitkari |
| 8 | Bellows Breath | Bhastrika |
| 9 | Skull Shining Breath | Kapalabhati |
| 10 | Fainting Breath | Murcha |

---

## Current state (what we reuse, not rebuild)

- **In-app heart rate reading** — `useHeartRateCapture`, `HeartRateScreen`, full BPM/HRV
  pipeline (`src/lib/heartRate/`). The HR half of the check-in already exists.
- **Exercise engine** — `ExerciseSessionPage`, `BreathingCircle`, `ExerciseScaffold` run
  any technique defined by an inhale/hold/exhale/hold `pattern`.
- **Ambient audio** — `useAmbientAudio` (expo-audio) + sound registry. Adding sounds is a
  content task.
- **Recommendation hook** — `useRecommendedTechnique` exists but only reads a saved
  default. No check-in, no AI yet. This is the seam the AI coach plugs into.

## The three real gaps

1. **Content** — `src/data/techniques.ts` has 5 generic techniques, none of the 10
   pranayama ones. Needs a schema extension + the 10 entries.
2. **Daily check-in → recommendation** — entirely new flow + recommendation engine.
3. **Coach video/voiceover layer** — no video player infra yet (only `DailyPlanCard`
   plays an mp4). Blocked on Yaduveer's assets, but the player can be built against
   placeholders.

---

## Build phases

### Phase 1 — Technique schema + 10 pranayama entries (unblocked)
**Goal:** data foundation everything else hangs off.

- [ ] Decide: replace the 5 generic techniques or add pranayama as a second category.
- [ ] Extend `BreathingTechnique` in `src/data/techniques.ts` with:
  - `traditionalName: string`
  - `writtenInstructions: string` (or structured steps)
  - `videoSource?: ...` (optional until assets arrive)
  - `voiceoverSource?: ...` (optional until assets arrive)
- [ ] Add the 10 techniques with `pattern`, English name, traditional name, placeholder
  copy/instructions, `backgroundImage`. Stub video/voiceover fields.
- [ ] `npx tsc --noEmit` clean; picker + session pick them up automatically.

**Output:** a fully browsable 10-technique library, runnable today without any video.

### Phase 2 — Daily check-in + rules-based recommendation (unblocked)
**Goal:** working check-in → recommendation loop with NO AI yet.

- [ ] New check-in flow UI: stress / energy / sleep / mood inputs.
- [ ] Trigger an HR reading from the check-in (reuse `useHeartRateCapture`).
- [ ] Recommendation engine in `src/lib/` (pure logic) mapping
  `{check-in + HR/HRV}` → one technique. Extend `useRecommendedTechnique`.
  - e.g. low HRV + high stress → Nadi Shodhana / Resonance; low energy → Bhastrika /
    Kapalabhati; needs cooling → Sheetali / Sitkari.
- [ ] Persist check-ins (new query/mutation; update
  `docs/query-cache-invalidation-map.md` in the same change).
- [ ] Add targeted tests for the recommendation mapping.

**Output:** a real "check in → get a breathing exercise" experience, AI-free.

### Phase 3 — AI layer on top of the rules engine (cost-controlled)
**Goal:** personalized framing without uncapped spend.

- [ ] Keep the Phase 2 rules engine as the deterministic floor + fallback.
- [ ] Call the model only for personalized copy/framing around the chosen technique.
- [ ] Cache by check-in bucket so identical states don't re-hit the API.
- [ ] Hard cost ceiling / rate limit; rules result always renders if the call fails.
- [ ] Use the latest Claude model for generation.

**Output:** the "AI coach" feel, with the precision + cost caveats structurally handled.

### Phase 4 — Coach video + voiceover layer (blocked on Yaduveer)
**Goal:** his demos + voiceovers layered over exercises.

- [ ] Add a video player to the exercise screen (expo-video).
- [ ] Layer voiceover playback over the existing breath-phase audio
  (`useBreathPhaseAudio` / `useAmbientAudio`).
- [ ] Wire `videoSource` / `voiceoverSource` from `techniques.ts`.
- [ ] Build against placeholder clips now; swap in real assets on delivery.

**Output:** guided exercises with Yaduveer as the on-screen/voiceover coach.

### Phase 5 — Immersive visuals & sounds (content)
- [ ] Add the full set of visuals/sounds he suggested into the audio registry +
  exercise backgrounds.

---

## Sequencing summary

1. Phase 1 — schema + 10 stubbed techniques (now)
2. Phase 2 — check-in + rules recommendation (now)
3. Phase 3 — AI framing on top (after 2)
4. Phase 4 — video/voiceover player (on Yaduveer's delivery)
5. Phase 5 — visuals/sounds (rolling content)

**Only Phases 4–5 are gated on Yaduveer.** Phases 1–3 deliver a complete
check-in-to-recommendation product before a single video arrives.

---

## Open decisions
- [ ] Replace vs. add the existing 5 techniques?
- [ ] Written instructions: free-text `description`-style, or structured step list?
- [ ] Where does the check-in live — new tab, Home entry point, or daily prompt?
- [ ] Check-in cadence: once/day enforced, or any time?
