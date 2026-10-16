# Preset plans: references and fit for Azora

Reviewed October 16, 2026. This review compares published product structures,
not paid-app session transcripts or evidence that a particular curriculum works.

## Comparable products

| Product | Published approach | Useful principle for Azora |
| --- | --- | --- |
| Headspace | Goal-specific courses; sleep content distinguishes preparing for bed, falling asleep, and returning to sleep after waking. | Match each lesson to the situation the user needs help with, even inside one broad goal. |
| Calm | Structured beginner programs, including 7 Days of Calm followed by 21 Days of Calm; sleep has dedicated content. | Give a preset a clear learning progression and an understandable next step. |
| Calm Health | Recommendations depend on goals, topics, conditions and screening answers; users can update those inputs. This is a separate product from consumer Calm. | Keep the selected goal visible in content selection and make changes deliberate. |
| Balance | The next plan day is surfaced on Today; sessions are personalized from experience, goals and preferences. | Provide a clear next activity and use relevant answers when adapting content. |

Sources:

- [Headspace sleep content](https://www.headspace.com/sleep-app)
- [Calm getting-started guide](https://support.calm.com/hc/en-us/articles/115002474567-Getting-Started-With-Calm-A-Beginner-s-Guide-to-Meditation-Sleep)
- [Calm Health plan management](https://support.calm.com/hc/en-us/articles/27262349360539-How-to-Manage-Your-Calm-Health-Plan)
- [Balance personalization](https://support.balanceapp.com/hc/en-us/articles/4407704821531-How-does-personalization-work)
- [Balance plan continuation](https://support.balanceapp.com/hc/en-us/articles/4407703834011-How-do-I-use-the-app)

## Original audit

Before the Phone split, Azora had nine plan presets and eleven lesson paths. Pressure had separate
stress, overthinking and patience paths; each other preset has one path. The
goal-aligned lesson editions tailor shared teaching to those paths.

The next personalization question is whether distinct goals still land on the
same path. `src/lib/onboardingPreset.ts` currently routes:

- Sleep with a phone-related answer and focus with a phone-related answer to
  the same Phone plan.
- Self-acceptance and building a daily habit to the same Self-Trust plan.
- Self-care, spiritual and yoga intents to the same Quiet plan.
- Heart-health and unspecified intents to Pressure's default stress path.

These are routing facts, not proof that every live onboarding option exposes
each intent. Legacy and saved intents also need consideration.

## Design and implementation

Keep the nine authored presets and short daily format. Add lesson tracks where
two actual user goals need different teaching, examples or next actions. Do not
create variants only to increase the number of presets.

Phone revision 11 implements bedtime versus work-distraction tracks, producing
twelve current lesson paths across the nine presets. A bedtime track should
keep its lessons focused on evening checking, night-time phone use and making
room for bedtime. A work track should focus on interruptions, purposeful checks
and returning to a chosen task. They may share source-backed teaching and a
practice schedule where both fit.

The remaining preset review checked `ACTIVE_INTENT_IDS` and
`ONBOARDING_INTENT_LOOKUP_OPTIONS` in `intentOptions.ts`. Self-acceptance,
spiritual, yoga and self-care are retired selectable options retained for saved
profiles. Quiet therefore does not need new onboarding tracks for those intents.

`daily_habit` remains live and routes to Self-Trust. Its follow-up questions promise
consistency through busy days, travel and missed attempts, while Self-Trust's
current curriculum also emphasizes confidence in decisions, advice and boundaries.
A dedicated habit-building track remains a separate curriculum task: it should
teach one repeatable action, a recognizable cue, a minimum version, missed-day
return, schedule changes and reducing friction. Keep legacy Self-Trust content
available rather than relabeling it as a complete habit curriculum.

Select a track from explicit answers and store it in the enrollment snapshot.
Persist the relevant follow-up answer if future restarts must reproduce that
choice. Preserve existing saved lesson IDs and progression. Changes to a running
plan should be deliberate rather than an automatic consequence of a profile edit.

Before publishing a track, review every day for a goal-specific teaching point,
relevant examples and a usable action. Verify practice pairing, lighter-day copy,
unique lesson IDs, all routing combinations, snapshot round trips, and historical
fallbacks. Product comparisons do not replace source review for health claims.

Learning: broad preset alignment and alignment to the user's exact selected
problem are separate checks. The latter matters most when routing several goals
into one preset.
