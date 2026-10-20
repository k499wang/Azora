# Mood check-in and insights

## Product model

Insights follow Liven's documented mood history, Most Frequent Feelings, and Top Reasons model, with week/month/year views and mood-type filtering. References: [Profile guide](https://support.theliven.com/hc/pt-br/articles/31384465754514-Aba-Perfil-o-que-posso-ver) and [Mood Tracker guide](https://support.theliven.com/hc/pl/articles/24141900792338-Mood-Tracker-Jak-%C5%9Bledzi%C4%87-swoje-wzorce-nastroju).

There are three cards, with no plan-completion or Reset comparisons:

- **Your mood:** mood timeline and a five-rating mood breakdown, with counts.
- **Most frequent feelings:** all explicitly logged feelings for the selected period and mood filter, ranked by frequency. Expanding a feeling shows accompanying contexts and supporting entries.
- **Top reasons:** recorded contexts ranked by frequency, grouped into Activities, People, and Places. Expanding a reason shows its mood distribution and supporting entries. Reasons are user-selected context, not inferred causes.

Week, Month, and Year mean rolling 7-, 30-, and 365-day windows including today. The All/Good/Okay/Rough filter applies to feelings and reasons; the mood overview retains every check-in in the selected period. Good includes ratings 4–5, Okay is 3, and Rough includes 1–2. Empty periods and groups show a plain empty state. First check-ins can populate all three cards immediately if a feeling and context were recorded.

## Check-in flow

`Your mood` → feeling → context → optional journal → reply and actions → insights.

Scale revision 2 asks only `overall`, with five ratings from Rough to Great. Energy and sleep are no longer questions. Scores map this single rating to 0–100. Historical answers and stored scores are retained; analytics use `answers.overall` when valid and fall back to the stored score for rows without a valid mood answer.

The feeling step suggests low and tense words for lower ratings, mixed words for a middle rating, and bright and calm words for higher ratings. More feelings offers all 30 words. Not sure records no feeling. No emotion is inferred from the rating.

Context remains one optional page, grouped into Activities, People, and Places. The same five-tag limit applies across all groups. Existing tag IDs remain valid. New people options include Partner and Coworkers; places include Home, Workplace, School, Gym, Café, and the existing Outdoors.

Suggested actions use the selected feeling and direct mood rating. Work, Study, Busy day, Chores, Alone, and Late night provide authored action relevance: two suggestions prioritize the feeling/mood pool and one can reflect context. Other tags stay neutral. Tag order does not affect selection; the local date rotates equally relevant choices. An explanation names only selected contexts represented in the offer, without inferring causes. Today’s existing to-do titles, including completed ones, are excluded using case, whitespace, and common punctuation normalization (not semantic matching). The screen reuses the first-win hook’s goals query, snapshots the offer when shown, and rechecks live titles before adding. Query failure does not block check-in; an exhausted pool offers Continue to insights. Users can add actions to their day or continue without adding any. Existing support-link behavior remains available for hopelessness or a recent run of hard days.

## Ownership and bounded work

Profile and the completed check-in share `MoodInsightCards`. Each screen owns one `useMoodInsights` instance for selected period/filter and one recent-check-in query. The pure `moodInsights` function applies date windows and calculates the overview, feelings, and grouped reasons. It has no dependency on daily activity, streaks, program completion, or Reset usage.

Both screens use the same bounded 366-row history query, enough for a year at one row per date. Feelings and reasons are bounded by the fixed vocabulary. Profile supplies the semantic `onSelectDay` callback, which opens History. Each expanded observation exposes at most five dates. The completed check-in can expand evidence without leaving its completion flow.

Today's new mood, feeling and tags replace any cached entry locally before persistence completes. Period/filter changes continue using that same fresh entry. Missing days remain gaps in the timeline.

## Storage and compatibility

No migration is required. `answers` is JSONB; `scale_revision` is stored per row. Existing `feeling`, `tags`, and `note` columns remain unchanged. The service retains missing-column compatibility; a backend without the feeling column can still save mood, tags and notes, but cannot retain feelings for later analytics.

One check-in per user per local date remains the storage model. A repeat save replaces that day's entry. Older apps can read new entries but may display missing energy/sleep answers and ignore newly introduced tags. Their original questions and insights remain until the app updates.

## Verification

Domain tests cover direct scoring, historical normalization, date boundaries, mood filters, full feeling vocabulary, grouped reason counts, missing data, and first-entry results. Flow tests cover the mood-only sequence, pending-save insights, live period/filter changes, persistence and completion navigation. UI tests cover accessible controls, context selection limits, expandable evidence and bounded date callbacks. Native layout and animation need a device smoke test.
