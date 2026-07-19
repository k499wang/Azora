# Home Insights — Extension Guide

The home screen's flashcard ("Recommended for you" → heart → recovery → stress) is driven by three independent registries. Each can be extended without touching the others.

```
src/
  data/
    techniques.ts                  # 1. breathing exercises
  lib/insights/
    recommendations.ts             # 2. exercise-recommendation rules
    index.ts                       # 3. insight builders + registry
  components/home/
    InsightsFlashCard.tsx          # presentation (rarely edit)
```

The flashcard lives in `src/screens/HomeScreen.tsx` directly under `TodayInsights`. It is gated by `FeatureKey.AdvancedStats`; locked users see `SAMPLE_INSIGHTS`.

---

## 1. Add a new breathing technique

Edit only `src/features/exercise/guidedBreathing/techniques.ts`:

```ts
{
  id: 'physio-sigh',
  name: 'Physiological Sigh',
  recommendedName: 'The Reset',
  description: '…',
  pattern: { inhale: 2, holdIn: 1, exhale: 6, holdOut: 0 },
  defaultRounds: 5,
  category: 'calm',
  icon: 'weather-windy',
  duration: '~1 min',
  backgroundImage: require('../../assets/exercises/sea.jpg'),
}
```

The exercise picker, session screen, **and** the recommendation engine pick it up by `id` with zero further changes. To make it appear as a recommendation, write a rule for it (next section).

---

## 2. Add a new recommendation rule

Edit only `src/lib/insights/recommendations.ts`. Push onto `RECOMMENDATION_RULES`:

```ts
{
  id: 'late-evening-stress',
  match: ({ stress }) =>
    stress != null && stress > 50 && new Date().getHours() >= 21,
  techniqueId: 'physio-sigh',
  reason: 'late evening + elevated stress — a sigh resets the system fast',
},
```

Rules:
- Evaluated **top-to-bottom**, first match wins. Order = priority.
- `match(ctx)` returns a boolean and reads from `InsightContext`.
- `techniqueId` must exist in `techniques.ts`. If it doesn't, the recommendation is silently skipped.
- `reason` is appended after an em-dash in the card detail. Keep it lowercase, no period.
- `DEFAULT_RECOMMENDATION` at the bottom of the file is the fallback when no rule matches.

The card title and CTA duration are pulled automatically from the technique.

---

## 3. Add a new field for rules to read

Example: you want rules to factor in time-of-day or a sleep score.

1. Add the field to `InsightContext` in `src/lib/insights/index.ts`:
   ```ts
   export interface InsightContext {
     // …existing
     sleepScore: number | null;
   }
   ```
2. Pass it from `HomeScreen.tsx` where `buildInsights({ … })` is called.
3. Any rule or builder can now read `ctx.sleepScore`.

---

## 4. Add a new non-recommendation insight card

If you want a card that is not an exercise suggestion (e.g. "Hold-time trend"), write a builder in `src/lib/insights/index.ts`:

```ts
const holdProgress: InsightBuilder = ({ todayHoldSeconds, bestHoldSeconds }) => {
  if (todayHoldSeconds == null || bestHoldSeconds == null) return null;
  const pct = Math.round((todayHoldSeconds / bestHoldSeconds) * 100);
  return {
    id: 'hold-progress',
    eyebrow: 'Hold insight',
    tone: `${pct}% of your best`,
    detail: `Today's hold is ${todayHoldSeconds}s vs your best of ${bestHoldSeconds}s.`,
  };
};
```

Then add it to `INSIGHT_BUILDERS`:

```ts
export const INSIGHT_BUILDERS: InsightBuilder[] = [
  exerciseRecommendation,
  holdProgress,        // ← new
  heartInsight,
  recoveryInsight,
  stressInsight,
];
```

Array order = flashcard order. Builders returning `null` are filtered out, so a builder that can't speak for the current day just disappears.

### Optional fields

A builder can include any of these on the returned `Insight`:

| Field         | Purpose                                                            |
| ------------- | ------------------------------------------------------------------ |
| `techniqueId` | Adds a CTA pill that starts that technique when tapped.            |
| `ctaLabel`    | Required alongside `techniqueId`. Shown on the pill.               |

Only the recommendation builder uses these today, but any builder may.

---

## 5. Update the sample (locked) state

When a user is on the free tier, the flashcard shows `SAMPLE_INSIGHTS` (bottom of `src/lib/insights/index.ts`) instead of real data. If you add a new insight type that you want non-pro users to preview behind the lock, add a matching sample entry there.

---

## Checklist when extending

- [ ] New rule references a `techniqueId` that exists in `techniques.ts`
- [ ] New `InsightContext` fields are passed from `HomeScreen.tsx`
- [ ] New builder returns `null` when its data is missing (don't show empty cards)
- [ ] `npx tsc --noEmit` passes
- [ ] If user-visible copy changed, follow the semibold font rule from `CLAUDE.md`
