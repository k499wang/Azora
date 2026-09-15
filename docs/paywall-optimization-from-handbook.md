# Paywall optimization: audit against *The Subscription Optimization Handbook* (2025)

Source: *The Subscription Optimization Handbook*, Vahe Baghdasaryan (Tangent) with Jacob
Rushfinn (Botsi), 57 pages, three chapters. Mined: Chapter 03 "Paywall Optimization"
(pp. 32–53) in full, plus the placement/trial tactics that touch the paywall — second-time
offers (p. 11), free-trial cancellation (p. 12), lifecycle campaigns (p. 13), transaction
failure (p. 10), still-unsure intervention (p. 38). Chapter 02 (Price Optimization) was
deliberately not mined.

## Where the paywall stands today

| Surface | What it is |
| --- | --- |
| Onboarding paywall (`OnboardingPaywallScreen`) | 4 steps, hard by default: ① Azo promise ② Free vs Pro table ③ reminder bell ④ trial timeline + reminder toggle + plan cards |
| Exit offer (`ExitOfferSheet`) | Discounted annual, 5-minute countdown, "offered once" confirm dialog. Triggers: `idle`, `purchase_cancelled` |
| Post-onboarding exit offer (`ExitOfferScreen`) | Same offer, `post_onboarding` trigger, over Home |
| Standalone paywall (`ProPaywallScreen`) | Dismissible modal reached from 15+ feature gates, each passing a `feature` param |
| Placements | `onboarding_complete`, `profile_upgrade`, `heart_rate_pro_gate`, `daily_result_pro_gate`, `exercise_premium_gate`, `exit_discount` |
| Analytics | Full `paywall_*` set with placement, feature, source, experiment id/variant, both price points; `exit_offer_*` with `trigger` |

Already covered by the handbook, so not worth spending on:

- **Second-time offers** (p. 11) — the exit offer exists.
- **Hesitation intervention** (p. 38) — the exit offer fires on idling on the plan step, which is that trigger.
- **Free-trial cancellation** (p. 12) — the reminder-before-billing toggle.
- **Personalization from user inputs** (p. 44–45) — step ① names the goal from onboarding.

## Tactic status

| # | Tactic (page) | Status |
| --- | --- | --- |
| 1 | Educate at the trial moment (p. 47) | **Partly covered — see below.** Decision: no extra paywall space |
| 2 | Refund guarantee (p. 43) | **Shipped** |
| 3 | Everyday-price anchor (p. 36) | **Removed** — shipped on both paywalls, then pulled at product request |
| 4 | Decline survey + targeted offer (p. 40) | Later. **Onboarding paywall only** |
| 5 | Feature-personalized standalone paywall (p. 35) | Later |
| 6 | Claimable trial (p. 46) | Held — "interesting, keep in mind" |
| 7 | Cognitive friction on the decline path (p. 48) | **Shipped** |
| 8 | Pitch by entry point / willingness to pay (p. 41) | Approved in principle — needs one decision |
| 9 | Paywall followups (p. 37, p. 13) | Not doing. Explained below |
| 10 | Attribution-matched hero (p. 50) | Not doing. Explained below |
| 11 | Toggle trial (p. 49) | Not doing — the reminder toggle stays as-is |
| 12 | Failed-payment recovery (p. 10) | Later |
| — | Second-time offer ≠ abandonment offer | **New requirement — see below** |

## 1. "Educate at the trial moment" — what it means and the space-lean options

The handbook's point (p. 47, "Blinkist Paywall Twisted") is *not* that the paywall lacks an
explanation of Pro. It is that a trial offer is such a strong hook that people agree to it
without registering **what they are agreeing to**, and then churn in week one. The fix it
recommends is to put the product's value *at the trial offer itself* — bullets, an
infographic, or a short video.

Azora already educates twice before that moment: step ②'s Free-vs-Pro table
("Personalized daily routine", "Quick daily exercises", …) and Azo's personalized promise on
step ①. What step ④ does not do is restate the value; its timeline explains the *mechanics*
(Day 1, reminder, billing), not what the trial unlocks. That is the whole gap.

Options, cheapest first. All three avoid adding a block to the paywall:

1. **Rewrite the Day 1 timeline row (zero new elements).** It currently says *"Your full
   personalized plan, unlimited exercises and all your health insights."* — which is the
   bullet list compressed into one sentence, and repeats "personalized" from step ①. Naming
   the three things concretely costs no space at all.
2. **Feed the parked bullets into that row.** `buildPlanHighlights()` already produces four
   personalized bullets and nothing renders them; the same content can drive the Day 1 row
   instead of a new list.
3. **Add one centred caption line under the timeline** using the value bullets, at roughly
   the cost of the new refund line (≈16pt, final step only, which already scrolls).

Recommendation: 1, then 2 if the row reads too thin on device.

## 5. Feature-personalized standalone paywall — what this actually is

**The tactic (p. 35, "Feature Personalized Paywalls").** Tapping a locked feature is the
clearest statement of interest the app will ever receive. Answering that tap with a
one-size-fits-all paywall spends the signal and says nothing back. The handbook's example is
Calm, which customizes the paywall by the locked content the user selected.

**Why this fits Azora unusually well — the wiring is already there.**

- `ProPaywallScreen` reads `route.params.feature` and feeds it to `usePaywall`, which stamps
  `feature` onto every `paywall_*` event. The paywall already *knows* which gate the user hit,
  and conversion is already measurable per feature. It just cannot act on it.
- A dozen-plus entry points set that param: heart-rate capture, result, placement and session
  detail screens; exercise search; daily start; guided breathing (both the Pro gate and
  opening a technique); breathing heart-rate monitoring access; the recently-logged section;
  shareable result; profile.
- The Free-vs-Pro comparison table already derives each Free cell from `featureAccess` per
  gate, so the vocabulary for "what this gate is" already exists in the codebase.

**What is missing, precisely.**

1. **A `FeatureKey` → benefit line map.** `FeatureKeyValue` is a union, so a `Record` over it
   will not compile until every gate has words — the same exhaustive pattern as the
   intent → headline-noun map in `paywallPlanHighlights.ts`.
2. **Anywhere to render it.** The standalone paywall opens straight into the trial timeline
   and the plan cards; there is no heading on this path. But `ProPaywallScreen` already
   defines `headerCopy`, `eyebrow`, `title` and `titleDivider` styles that **nothing renders**
   — a styled, empty slot left by an earlier design, which is exactly where this line belongs.
3. **A fallback.** `feature` is optional (`profile_upgrade` and other generic entries pass
   none), so the generic opening has to stay for those.

**Shape if built.** `featureLine(FeatureKeyValue)` returning one sentence ("Live heart rate
through every exercise", "The full reset library"), rendered in the existing header slot when
`feature` is present, with today's copy as the fallback. Measure conversion per feature before
and after — the dimension is already logged, so this is a clean before/after rather than a
new instrument.

**Caveats.**

- It only pays off if the line is **specific**. "Unlock Pro" spends the user's attention saying
  what they already know.
- A **mismatch is worse than generic**: the user just told you why they came.
- **Do not invent a second vocabulary** for the same gates — the comparison table's row labels
  already name each benefit, and two wordings for one gate will drift.
- Keep it to the **headline**. Personalizing the whole deck multiplies the surfaces that can
  contradict each other.

## 8. Pitch by entry point — the one decision needed

The handbook (p. 41, Instasize) varies the *offer* by where the user hit the paywall: a
low-interest entry (Settings) leads with a trial; a high-interest entry leads with the
commitment. Azora sends every entry into the same 4 steps. The proposal is to vary the
*pitch*, never the price for the same product:

- Low-intent (`profile_upgrade`) → all 4 steps, leading with the trial and the comparison.
- High-intent (`heart_rate_pro_gate`, `daily_result_pro_gate`, `exercise_premium_gate`) →
  open on the plan step with the annual card pre-selected.

Needs a decision on whether skipping steps for feature gates is acceptable UX, since those
entries currently show the same deck from step ①.

## 9. "Paywall followups" — what this actually is

**The observation (p. 37).** Most subscribers convert after one or two paywall views. A
distinct group behaves differently: they open the paywall repeatedly, spend real time on it,
and close it without buying. That is not disinterest — it is high intent with an unmet
objection, and it is invisible if you count paywall views per *paywall* rather than per
*person*. The handbook pairs it with p. 38 (most subscription decisions happen inside the
first 24 hours, so hesitation is worth chasing early) and p. 13 (an abandoned transaction is
one of the strongest intent signals available, and the sooner the follow-up, the higher the
conversion).

**The tactic is three steps, and none of them are on the paywall.**

1. Expose a per-user counter to your CRM/analytics — the handbook says send the paywall view
   count as a user property.
2. Segment the people above a threshold who have not purchased.
3. Reach them with a survey that asks what is missing, or a tailored incentive (trial
   extension, different package, discount).

**What Azora already has.** Every `paywall_*` event carries `paywall_view_id`, `placement`,
`source_screen`, `source_action`, `feature`, both price points and the experiment
variant; `exit_offer_*` carries `trigger`. So step 1 is a PostHog person property away. Push
is real and wired (`expo-notifications`, `notificationScheduler`, the trial-reminder
preference, plus `docs/architecture/notifications.md`), so step 3 has a channel.

**What is genuinely missing.**

- **No aggregate.** `paywall_view_id` identifies a single view; nothing counts views *per
  person*, so the segment this tactic depends on does not exist today as a number.
- **No email *channel*.** Addresses exist (Supabase auth via Apple/Google with the email
  scope, synced to RevenueCat `setEmail` and AppsFlyer), but there is no ESP integration in
  the repo, so email is identity data only. Push is the only live send path.
- **The sequencing collides with the exit offer.** A user idling on the plan step already
  meets a discount 20 seconds in. By the time their view count reaches 3, they have very
  likely already declined an offer, so a follow-up discount teaches them that declining
  works. The lifecycle message has to offer something *different* — a longer trial, a package
  switch, or the survey — or it has to land before the exit offer is available.

**Shape if built.** `paywall_view_count`, `paywall_declined_count` and `last_offer_at` as
person properties; a rule like "≥3 views, no purchase, no offer in the last 7 days"; a push
that asks the one survey question instead of discounting again; measured as a cohort against
users who were never contacted.

**Why parked.** It is a lifecycle/CRM project wearing a paywall hat. It needs an owner for a
messaging calendar, and until the sequencing question above is answered it risks
cannibalising the offer you already ship.

## 10. "Attribution-matched hero" — what this actually is

**The tactic (p. 50).** Apps running Apple Search Ads send a user from a keyword-matched
Custom Product Page into the app, and the paywall then continues *that* promise — someone who
arrived on "background remover" gets a background-remover paywall. The handbook's complaint
is that personalization stops at the landing page, so the ad buys attention and the paywall
spends it on a generic pitch.

**What Azora already has.** Onboarding captures `acquisitionSource` and `attPriming`; a
dedicated `20260728000100_add_onboarding_attribution.sql` migration records attribution at the
seal step even for users who abandon before the paywall; AppsFlyer identity is synced. And the
paywall already personalizes — but from `planIntent`, the goal the user picked seconds
earlier.

**What is actually missing.**

- **Keyword-level source data.** The tactic assumes campaigns are specific enough to carry an
  angle ("background remover", "sleep sounds"). A generic channel value ("meta", "organic")
  carries no angle, and you cannot personalise against a word that vague.
- **A source → paywall-angle map.** Nothing in the repo maps an acquisition source to copy.
- **A precedence rule** for when the source and the self-declared intent disagree.

**Why not now.** Intent is the stronger signal: the user chose it, on this screen, in this
session, whereas the source is an inference about why they tapped an ad. Getting precedence
wrong produces the worst available outcome — a paywall talking about sleep to someone who just
said they want focus — and that reads as broken rather than personalised. It becomes worth
building when ASA/CPP campaigns are specific enough that the keyword beats the intent, and
then only for the headline angle rather than the whole deck, with both inputs logged so you
can measure which one won.

## 12. Failed-payment recovery — what this actually is

**The handbook (p. 10, "Transaction Failures").** A failed transaction is not a casual
browser: the user already decided to subscribe, which makes them the most valuable cohort on
the screen. The prescribed response is immediate and personalised — a CRM pop-up or email
inviting a retry, or, more directly, *a personalized paywall on their next session that
acknowledges the failed attempt* and invites them to finish. (Chapter 02 covers the renewal
side of the same family — pre-payment, payment failure, frictionless payment — and was not
mined, but that is where involuntary churn lives.)

**The word "failed" hides three different events, and they need different responses.**

| Event | What happened | Right response |
| --- | --- | --- |
| User cancelled the store sheet | Deliberate. Not a failure at all | Already handled — this is the `purchase_cancelled` exit-offer trigger. No recovery messaging |
| Store declined the payment | Card declined, insufficient funds, region block. They wanted it and the bank said no | The real recovery case: acknowledge it, make retrying easy. Not a discount — price was never the objection |
| Our purchase call errored | Network, SDK or config failure | Silent retry. There is no persuasion problem here |

**What Azora has today.** An inline error block plus Retry on the final step (`errorMessage`,
`onRetry`, `retryRevenueCatSync`), and `paywall_failed` carrying `stage`, `error_code` and
`error_message`. Server-side, the RevenueCat webhook handles `BILLING_ISSUE`, and the
entitlement model carries an `in_grace_period` status.

**What is missing.**

- **Nothing survives the session.** A failed attempt leaves no in-app state, so the next app
  open is indistinguishable from a first visit. p. 10's "personalized paywall on their next
  session" is not buildable today — that is the gap, not the analytics.
- **The three cases are not distinguished or persisted**, so any follow-up would be guessing
  which of them it is answering.
- **Grace-period users are treated as Pro and never told.** The entitlement model already
  knows a renewal payment failed; the UI never says so — the renewal-side version of the same
  missing message.

**Shape if built.** Persist `lastPurchaseFailure = { kind: 'cancelled' | 'declined' |
'technical', at, offeringId }` (locally, and on the profile if it should survive a reinstall);
on the next app open, `declined` earns a recovery surface that reopens the paywall with
*"Your payment didn't go through — try again"*, `technical` retries quietly, and `cancelled`
stays out of it entirely. Separately, decide whether grace-period users get an in-app prompt
to update their payment method.

**Risks.** Never tell someone their payment failed when they cancelled it — that is a
trust-destroying, support-ticket-generating inaccuracy, and it is why the three cases must be
separated before any copy is written. Cap the surface so it cannot nag, and drop it for good
once the user declines it.

**Measurement.** `paywall_failed` → purchase within 7 days, split by `kind`; and
grace-period → recovered-payment rate.

## Anchor research

The handbook's §Comparison Paywalls (p. 36) is about comparing your price with something
familiar, on the behavioral-economics principle of anchoring. This section records what was
tried, what it was replaced by, and what the evidence actually supports.

**Decision: the coffee anchor is removed.** It shipped as *"Azora Pro is less than a coffee
per month."* above the trial reminder on both paywalls and was pulled. Two standing objections:
the claim has no figure attached (so it cannot be checked against the real price), and at a
higher annual price a monthly figure stops being "less than a coffee".

**What the sources say.**

| Source | What it contributes |
| --- | --- |
| [Superwall — 5 Paywall Patterns](https://superwall.com/blog/5-paywall-patterns-used-by-million-dollar-apps) | The documented in-app version of anchoring is the **decoy plan**, not objects: Calm (high monthly anchors the yearly), MacroFactor ("Most Popular" on 12-month), SCRL ("SAVE 85%"). Also recommends A/B testing "59.99/year vs 4.99/month" display |
| [FunnelFox — App Pricing Models](https://blog.funnelfox.com/app-pricing-models-guide/) | Names the objects outright: *"user alternatives (a tutor at $30/hour, a gym membership at $50/month, a lawyer at $200 per consult)"*, and the phrasing *"less than a coffee a week" / "under $0.20 a day"* |
| [Kickstart — the coffee test](https://www.kickstart.tools/blog/how-to-price-an-app-the-coffee-test) | Turns the comparison into a pricing method rather than paywall copy |
| [Verywell Mind — mental health apps](https://www.verywellmind.com/best-mental-health-apps-4692902) | The same framing in this app's category: therapy apps benchmarked against the cost of a session |
| [PaywallScreens](https://www.paywallscreens.com/) · [Adapty Paywall Library](https://adapty.io/paywall-library/) · [Roast My App swipe file](https://www.roastmyapp.co/paywall-examples) | Where to browse real paywall screens per app |

**Live instances of object anchoring** — all marketing or web checkout, none in-app, which is
itself the finding:

- [Pages of the Ancestors](https://www.instagram.com/reel/DbaiOfXAF2s/) — *"Less than a coffee a week … £7.99 a month or £99.99 a year. Try it free for 7 days."*
- [Shedlife Club](https://www.facebook.com/Shedlifeproductions/posts/1369656928692728/) — *"LESS THAN A COFFEE A WEEK TO CHANGE YOUR LIFE? … For just $0.65 a day"*
- [CoachMeUp.AI](https://www.reddit.com/r/growmybusiness/comments/13qjpwx/ai_career_coach_coachmeupai_feedback/) — *"starting from less than a coffee a week"*
- [Quizgecko (App Store)](https://apps.apple.com/us/app/quizgecko-ai-flashcards/id6473546188) — developer reply: *"way less than a coffee a week"*

**If an anchor is revisited**, the constraint is that it must be same-period (monthly vs
monthly) and true at every price point. Ranked for this app's umbrellas, strongest first:

1. **One therapy session** — same category as `calm`/`balance`, largest honest gap
2. **A month of sleep aids** — direct substitute for the `sleep` umbrella
3. **Your streaming subscription** — universal and verifiable
4. **A gym membership** — fitness-adjacent for `energy`/`heart health`
5. **Coffee** — cheapest and easiest to dismiss; dropped here

## Second-time offer ≠ payment-abandonment offer

Current behaviour: one offer, identical for all three triggers. The repo already flags this
as a decision to check — see `docs/analytics/current-posthog-events.md`: *"The three triggers
are not the same user… The offer is identical for all three, which is a decision worth being
able to check."* Requirement: make them different.

| Trigger | What the user actually did | Offer shape |
| --- | --- | --- |
| `purchase_cancelled` | Backed out of the store sheet with a thumb on the button. Price/uncertainty at the final tap; highest intent | Keep the discount (best fit for this one). Pair with the refund reassurance |
| `idle` | Lingered on the plan step, possibly only reading. No price objection expressed | **No discount.** Value offer instead — extended trial or a feature-specific pitch. Discounting here teaches waiting for a discount |
| `post_onboarding` | Already declined once, now in Home | Different package or commitment (weekly, or a trial extension), shown at the next natural gate rather than unprompted |

Implementation notes: `ExitOfferSheet`/`ExitOfferScreen` already receive `trigger`, and the
paywall analytics already carry it, so the branch is a prop-level change; add an offer-kind
property to `exit_offer_*` events so the variants can be compared. The 5-minute countdown and
"offered once" dialog should stay on the `purchase_cancelled` variant only — scarcity on a
value offer that the user never asked about reads as pressure.

## Deeper-audit findings

- **Price parsing was duplicated** in `PlanCard.tsx` and `ExitOfferContent.tsx`, with
  different behaviour for European price strings (`1.299,00 €`). Both now use
  `src/lib/paywall/planPrice.ts`.
- **`UrgencyBanner` is dead** — exported from `PlanCard.tsx`, never rendered.
- **No post-cancel win-back.** Handbook p. 12 asks for a discounted paywall on the next app
  open after a trial cancellation. The exit offer covers declines, not cancellations, and no
  placement exists for it. Verify whether the RevenueCat `CANCELLATION` webhook already gives
  a usable signal.
- **No email *channel*.** Email addresses are captured (Supabase auth via Apple/Google, synced
  to RevenueCat and AppsFlyer), but there is no ESP integration anywhere in the repo, so the
  p. 37 / p. 13 lifecycle tactics have nowhere to send. Push is the only live channel
  (`expo-notifications`); `docs/onboarding-expansion-plan.md` already lists email capture as a
  recovery surface for onboarding abandons.
- **Monthly framing is inconsistent.** The exit offer computes a monthly figure; the
  onboarding paywall never does. Not a bug, but the two surfaces speak different units.
- **The standalone paywall is dismissible** while onboarding is hard — a placement-policy
  difference worth stating deliberately rather than inheriting.
- **Trial-length testing is unavailable** without store-side product changes; the handbook
  treats an extended trial as a first-class lever both for offers and for second-time offers.

## Shipped in this pass

- **Refund guarantee** (handbook p. 43) — sits directly under the two plan cards on both
  paywalls, worded as the handbook's own standard guarantee: *"Satisfaction guaranteed or your
  money back."* Worth knowing: Apple grants refunds on request rather than by policy, so this
  is a promise the app makes on Apple's behalf. The handbook's fuller treatment adds a brief
  explanation of the refund process, which this one-line version omits
- **Everyday-price anchor — removed.** *"Azora Pro is less than a coffee per month."* shipped
  on both paywalls, above the trial reminder toggle, and was then pulled: the coffee comparison
  was rejected as a price anchor. The two `trialNote` styles it borrowed are back to their
  prior state. Research on the tactic and its real-world examples is in `## Anchor research`
- **The refund line ships on the standalone `ProPaywallScreen` too**, not just the onboarding
  deck, with its copy defined once in `src/lib/paywall/paywallReassurance.ts` — two copies of a
  promise is how one of them quietly stops being true
- **Plan-card terms line removed** at product request: the side-by-side cards no longer print
  "Billed weekly" or "Then $X/year". Note this affects the standalone `ProPaywallScreen` too
  (same card layout), and the annual card now leads with its per-week equivalent alone —
  see "Open questions"
- **Timeline copy leading 2pt tighter** (`TIMELINE_BODY_LINE_HEIGHT`), with the shared copy
  floor measured from the same number so the icons stay evenly spaced down the rail
- **Trial timeline made tighter**, not smaller: the label size is unchanged (Day 1 / Day 6 /
  Day 7 stay at scaleType 20), and instead the block's vertical rhythm — `marginTop`,
  `paddingTop`, `paddingBottom` and the row gap — went from `spacing.md` to `spacing.sm`, with
  the rail's bridge/leading/trailing offsets changed to match so the rail stays continuous.
  Saves ~40pt on the final step
- **Cognitive friction on the decline path**: the final step's bare × is now a labelled
  "Continue with limits" control with a matching accessibility label (p. 48). Soft-paywall
  mode only — under the hard paywall there is no decline control to label
- Shared price math in `src/lib/paywall/planPrice.ts` + tests

Verified: `npm run typecheck` clean, `npm test` 934 pass.

## Open questions

1. Should feature-gate entries skip to the plan step (§8), or keep the full 4-step deck?
2. Which trigger keeps the discount when the offer variants land — `purchase_cancelled` only?
3. Is a 7-day trial the tested value, or should trial length become an experiment?
4. Does the app already receive trial cancellations in a form a win-back placement could use?
5. Should grace-period users (renewal payment failed, still Pro) get an in-app prompt to fix
   their payment method? The entitlement model already knows; the UI never says.
6. With the plan-card terms line gone, the annual card shows only a per-week figure until the
   store sheet states the real charge. Apple's sheet is authoritative, but guideline 3.1.2
   expects the app to disclose duration and price itself — worth a look before submission.
   Cheapest fix now that the coffee line is gone: restore the yearly terms line on the annual
   card itself.
7. The coffee anchor is removed everywhere. If a price anchor is wanted later, the least
   contestable version for this category is an alternative-spend comparison (one therapy
   session, a month of sleep aids) rather than an everyday purchase — see `## Anchor research`.
