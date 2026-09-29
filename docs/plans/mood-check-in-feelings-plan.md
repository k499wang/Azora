# Mood check-in: feelings, personal reply, support link

Upgrades the existing daily check-in (`src/screens/MoodCheckInScreen.tsx`). No new entry point; Home's mood daily row stays as it is.

Why: naming a feeling precisely reduces its intensity (Lieberman 2007, affect labeling) and finer emotion vocabulary predicts better regulation (Kashdan, Barrett & McKnight 2015). The current check-in only asks Rough–Great. The reply is also generic, and the tag patterns that already exist (`factorEffects`) are only visible on Profile.

## 1. Feeling step

New page after the three scales, before tags. Question: "Which word fits best?"

The words come from the answers already given: `overall` (pleasantness) and `energy`. `sleep` is not used.

| Set | Rule | Words |
|---|---|---|
| `tense` | overall ≤ 2, energy ≥ 3 | Anxious, Stressed, Overwhelmed, Irritated, Restless, On edge |
| `low` | overall ≤ 2, energy ≤ 2 | Sad, Drained, Flat, Numb, Lonely, Hopeless |
| `mixed` | overall = 3 | Scattered, Tired, Bored, Unsettled, Meh, Fine |
| `bright` | overall ≥ 4, energy ≥ 3 | Happy, Excited, Motivated, Focused, Proud, Hopeful |
| `easy` | overall ≥ 4, energy ≤ 2 | Calm, Content, Relaxed, Grateful, Rested, Cozy |

- One tap picks a word and advances on the same beat as the scale pages (`answer` timing path).
- A "Not sure" chip is always present. It advances and stores `null`. Nobody is forced to label.
- Chips follow `MoodTagGrid`'s visual treatment.
- Progress bar denominator gains one page.

Storage: new nullable `feeling text` column on `mood_check_ins` (stable kebab-case id, e.g. `on-edge`), length ≤ 32. Domain sanitizer rejects unknown ids. Service reads and writes it with the same missing-column tolerance the tags/note columns have; a backend without the column must still read and save tags and note.

## 2. Personal reply

- The "only a low day earns an offer" rule is unchanged.
- On a low day with a `tense` or `low` feeling, the technique comes from the feeling, not the weakest scale:

| Feeling | Technique | Remedy |
|---|---|---|
| anxious | `478` | steadying |
| stressed | `extended-exhale` | steadying |
| overwhelmed | `relaxing` | steadying |
| irritated | `sitali` | steadying |
| restless | `belly` | steadying |
| on-edge | `coherent-6` | steadying |
| sad | `resonance` | steadying |
| drained | `morning-charge` | energizing |
| flat | `morning-charge` | energizing |
| numb | `resonance` | steadying |
| lonely | `relaxing` | steadying |
| hopeless | `resonance` | steadying |

  Never high-ventilation (no `wimhof`, `bhastrika`). Any other feeling, or none, keeps the weakest-scale logic.
- Recommendation line with a feeling: `Feeling {word}. We recommend a short {remedy} exercise to help you feel better.` Without: unchanged.
- Non-low reply with a feeling: `Feeling {word}. {moodReply(band)}`. Without: unchanged.

## 3. One pattern line on the reply

- Run `factorEffects` over the recent check-ins (`useRecentMoodCheckInsQuery(userId, 62)`, already cached by Profile and the tour), with today's row replaced by the answers just given.
- Among the tags chosen today, pick the factor (better or harder) with the largest absolute effect.
- Copy: `You tend to feel better on days tagged {Label}.` / `Days tagged {Label} tend to be harder for you.`
- Nothing shown when the query is not loaded, no tag qualifies, or `factorEffects` returns null. The existing thresholds decide; do not lower them.

## 4. Support link

Shown on the reply page when either:
- today's feeling is `hopeless`, or
- the three most recent check-ins (today's included) are all `low` band and all fall within the last 7 days.

Copy: `A few hard days in a row. Talking to someone can help.` (for `hopeless` alone: `That sounds heavy. Talking to someone can help.`). Button: `Find someone to talk to` → `https://findahelpline.com` (international directory; routes by country). Lip button (`ChunkyButton`), quiet tone. Placed under the reply line, above the actions. Pure rule lives in the mood domain with tests.

## Analytics

- `trackMoodCheckInCompleted` gains `feeling` (id or null) and `feelingSet`.
- New events: support link shown, support link tapped.

## Not in this change

Drag pad, body map, HealthKit `HKStateOfMind`, post-session re-check. Revisit after the feeling step has data.

## Rollout

The migration must be applied before the build ships, or the feeling is dropped on save (check-ins still work).
