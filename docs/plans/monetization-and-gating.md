# Monetization And Gating

## Status

Decided, except where marked **Open**. Covers what is free, what is gated, and
what the plan catalogue is for commercially.

## Where things stand

- **No defined free product tier.** In `hard` paywall mode the app is locked
  until someone subscribes; in `soft` mode the user can continue without Pro.
  `paywallMode` comes from the RevenueCat offering (`OnboardingFlow.tsx:434`),
  and missing metadata fails soft. The live RevenueCat configuration, not this
  repository, determines which mode users currently see.
- **The paywall is the last step of onboarding** (`OnboardingFlow.tsx:248`).
  Diagnosis, plan reveal, first session, Mochi placement, notifications and the
  pact all happen before it. The whole of onboarding is the pitch.
- **Two packages: weekly and annual** (`paywallService.ts:86`). Annual is
  $59.99. There is no monthly.
- **The annual package may offer a seven-day trial**, subject to store
  eligibility. The weekly package is paid immediately.

## The three words, since they get mixed up

| | What it means | Limited by | Azora |
| --- | --- | --- | --- |
| **Free** | Use part of the app forever, no card, nothing expires | features | none today |
| **Free trial** | Everything unlocked for a fixed number of days, then becomes paid on its own | time | eligible annual purchases |
| **Paid** | Pay first, then use | — | weekly, or annual after an eligible trial |

For an eligible annual purchaser, the trial is effectively "week 1 free": seven
days with everything open before billing. Weekly purchasers and trial-ineligible
annual purchasers do not have that free week. Store confirmation always occurs
when the purchase or trial is authorised.

## Decisions

### Never feature-gate the trial

The trial is limited by **time only**. Seven days of the complete product,
every plan, every technique. A trial that is also feature-limited cannot do its
job — the person decides whether to keep paying based on a crippled version of
the thing they would be paying for.

Gating only ever applies to a free tier. These are different questions and
conflating them is what makes the whole subject confusing.

### Never lock later weeks for people who have paid

Anyone entitled through a subscription or trial gets the complete catalogue.
Locking week 6 would lock a customer out of what they were offered. Peloton
time-gated program weeks exactly this
way, took sustained backlash, and removed it in the 2025 relaunch.

The visible post-trial weeks are the opposite of a problem — they are the pitch.
A seven-day trial showing a multi-week program makes the thing being bought
visibly larger than the thing being tried.

### If a free tier is added, this is the split

| | Free (no card) | Trial (7 days) | Paid |
| --- | --- | --- | --- |
| Week 1 of the recommended plan | yes | yes | yes |
| Weeks 2 onward | locked | yes | yes |
| Choosing from the catalogue | recommended plan only | yes | yes |
| The room and Mochi | yes | yes | yes |
| The Protocol / breath hold | yes | yes | yes |
| Technique library | week 1's techniques only | yes | yes |
| Switching plans | locked | yes | yes |

**The room and Mochi stay free.** They look like the premium reward, so the
instinct is to gate them. Do the opposite: they are the only things that
accumulate, which makes them both the reason to come back and the reason
leaving costs something. Give them away and let the week-2 wall sell.

**Week 2 is the right wall.** It arrives after the person has felt the thing
work, and the ask is legible — "you finished week 1, week 2 is where it builds"
— rather than a nag or a button that was dead on day one.

**Close the replay loop.** If week 1 is free, completing it must be permanent.
The plan does not loop back to week 1 for a free user.

### Sequence: catalogue first, free tier later

Ship the catalogue without changing the current RevenueCat configuration. Get a
clean read on whether a named program lifts trial starts. Only then test a free
tier or paywall-mode change, as its own experiment.

Running both at once means never knowing which moved the number. The tension is
real and worth writing down:

- **Against a free tier.** The funnel is built around a subscription paywall and paid
  acquisition. The activation north star is *5+ sessions in 7 days among trial
  starters*; a free tier fills that denominator with people who were never going
  to pay, at exactly the moment the number needs to steer the catalogue.
- **For a free tier.** The stated goal is Finch's audience, and **Finch is
  free-first**. That audience largely does not start trials — they download
  something free, get attached, and upgrade later. A hard paywall is
  structurally the wrong door for them.

## What the plan catalogue is for, commercially

Revenue is `installs × finish onboarding × start trial × survive to day 7 ×
weeks retained × price`. The catalogue moves two of those rows and gates none.

1. **Start the trial.** The paywall currently sells "an app". With the catalogue
   it sells "your six-week Calm Down Faster, starting tomorrow" — same screen,
   same price, visibly bigger object.
2. **Survive to day 7.** Someone who completes five sessions in their free week
   converts. Settle-phase behaviour — one short session a day, same technique —
   is exactly that. **Week 1 should be tuned for the activation metric, not for
   the most elegant opening of a multi-week arc.**

Nothing in the catalogue is ever sold separately. There is one transaction.

## Retention, given weekly billing

A weekly subscriber makes 52 renewal decisions a year. A plan in progress is the
only thing that argues against each one.

1. **Align the week boundary with the billing day** so the charge lands the same
   day a new technique arrives.
2. **Put something on day 7.** Today the day the card is charged is silent in the
   app. A "you finished your first week" moment turns a bank notification into a
   small win. Cheapest retention work available.
3. **Four-week plans are a retention risk.** The Sleep Reset and Morning Engine
   end after four billing cycles with nothing pulling forward, and a plan ending
   is a cancel prompt. Either offer the next plan before the last week closes, or
   make the entry plans six weeks.
4. **Never let a plan end with nothing next.** The final week is a door, not a cliff.
5. **Push annual with plan length, not a discount.** A twelve-week program costs
   more than $59.99 at any weekly price we would charge. The arithmetic is the
   argument, and it is honest.
6. **The toolkit and the room are the switching cost.** They are the only
   accumulating assets; they should be visible when someone is deciding.

## What not to do

- **No streak punishment, no wilting, no lost progress.** Named in the research
  as an anti-pattern for this audience — Habitica's own wiki concedes it — and
  already forbidden by `design.md`'s presence-not-absence rule. The program-day
  indexing solves the guilt problem; that is a retention feature, not a softness.
- **No second tier.** The $79.99 tier was already scrapped. Splitting the
  catalogue across tiers reintroduces gating by another door.
- **No purchasable room currency.** It breaks the earn-by-doing loop that makes
  the room mean anything, and selling shortcuts to people who struggle with
  follow-through is the wrong business.
- **No selling plans individually.** That charges twice for something bought at
  the door.

## Open

- Whether to add a free tier at all, and when. The split above is the design if
  the answer is yes; the sequencing argument says not in the same release as the
  catalogue.
- Whether the four-week plans move to six weeks, or whether the next-plan offer
  arrives early enough to cover the gap.
- Whether a reverse trial (no card until day 7) is worth testing once the
  catalogue has a clean baseline.
