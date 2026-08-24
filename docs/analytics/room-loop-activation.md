# Room Loop Activation

What the room events are for, and the one question they exist to answer.

Event names and properties live in
[current-posthog-events.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/analytics/current-posthog-events.md#room-and-hotel).
The loop's rules live in
[room-hotel-plan.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/room-hotel-plan.md).

---

## The question

**Do users who build rooms convert better than users who don't?**

Everything downstream — whether to widen the free tier, whether to sell room
breadth as a Pro upsell, whether the hotel is worth building — turns on that one
answer. Until it has a number, room work is a bet rather than a decision.

## The free-tier cohort

`FREE_DAILY_LIMITS[DailyExercise]` is `3`
([featureAccessCore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/featureAccessCore.ts)),
and the counter sums breath holds and breathing sessions together. A room piece
requires all three dailies (`DAILIES_PER_DAY = 3`), so a free user can now earn
one piece per day by completing the full daily loop.

While the RevenueCat offering uses soft paywall mode, that makes the non-null
`is_pro = false` slice the free-tier comparison cohort. Hard mode still prevents
new free users from reaching the app. `is_pro = null` means the canonical
entitlement lookup failed; it is not classified as free. Events recorded before
this policy change may contain only Pro or trialing room participants.

## The funnel

In order, all carrying nullable `is_pro` and `floor`:

| Event | The step | The drop-off it exposes |
| --- | --- | --- |
| `dailies_completed` | All three dailies done | — |
| `room_reward_unlocked` | …and a piece was actually earned | Room full, or already claimed today |
| `room_picker_opened` | Empty slot tapped | Earned a piece, never came to spend it |
| `room_decoration_placed` | Piece placed | Opened the picker, chose nothing |
| `room_completed` | Seventh piece, room full | Lost interest mid-room |
| `room_started` | Floor *n+1* opened | Finished a room, never began another |

The unlock/place split is the important one. A user who is handed a reward and
walks away is a different failure from one who never earns it, and needs a
different fix.

## The activation metric

**3+ room pieces earned in the first 7 days.**

One piece per day is the cap, so this is three separate days of completing every
daily inside the first week — engaged behaviour, hard to reach by accident, and
precisely the behaviour that is supposed to cause conversion.

It is the free-tier counterpart to the trial-starter north star (5+ sessions in
7 days), which has no denominator for users who never start a trial.

## Measuring it in SQL, not PostHog

`room_decorations.earned_local_date` already records every earn, so this can be
run today and back to the first room ever built. Events get dropped in transit;
rows do not. **SQL is the source of truth for the metric; the PostHog events are
for funnel shape and for splitting by feature flag.**

```sql
with cohort as (
  select user_id, created_at::date as signup_date
  from profiles
  where created_at >= now() - interval '60 days'
),
pieces as (
  select
    c.user_id,
    count(distinct d.earned_local_date) as first_week_pieces
  from cohort c
  left join room_decorations d
    on  d.user_id = c.user_id
    and d.earned_local_date >= c.signup_date
    and d.earned_local_date <  c.signup_date + 7
  group by c.user_id
)
select
  p.first_week_pieces >= 3            as activated,
  count(*)                            as users,
  count(*) filter (where e.is_pro)    as paid,
  round(100.0 * count(*) filter (where e.is_pro) / count(*), 1) as pct_paid
from pieces p
left join user_entitlement_v e on e.user_id = p.user_id
group by 1;
```

Two rows come back. The gap between their `pct_paid` is the answer.

`earned_local_date` is a local date and `profiles.created_at` is UTC, so the
window is approximate at its edges by up to a day. That is deliberate — the
alternative is storing a signup local date nobody else needs — and it does not
move a 7-day boundary enough to matter.

## The decision rule

Written down in advance so the result cannot be re-interpreted after the fact.

- Activated users convert at **≥2x** non-activated → the room is a monetization
  asset. Keep the full daily loop available and build room breadth (shells,
  hues, exclusive options) as the Pro upsell.
- They don't → the room is decoration, not a driver. Return the free exercise
  limit to 1 and stop investing in the hotel.

Read leading indicators (D7 retention, pieces earned) at 2 weeks; conversion
needs more sample, so read it at 6.
