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
| 3 | Everyday-price anchor (p. 36) | **Shipped** |
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

Tracking only, plus one behaviour it enables. The handbook (p. 37) observes that a distinct
group opens a paywall repeatedly, spends time on it, and leaves without buying — and that
this is high intent with an unmet objection rather than disinterest. Its suggestion: put the
**paywall view count** on the user profile in the CRM, then target those users with a survey
or a tailored incentive.

Why it applies here: `paywall_view_id`, `placement`, `source_screen` and both price points
are already logged per view, so the data exists and nothing consumes it. Concretely it would
mean sending `paywall_view_count` as a PostHog person property and firing one push (you have
push; §"Gaps" below notes email is missing) to anyone at ≥3 views with no purchase, offering
a trial extension or a discount.

Why it is parked: it is a CRM/lifecycle project, not a paywall change, and it competes with
the exit offer for the same hesitant user.

## 10. "Attribution-matched hero" — what this actually is

Chapter 03's last tactic (p. 50, "Keyword Ads Paywall Personalization") is about ad-to-paywall
continuity. Apps running Apple Search Ads send a user from a keyword-matched Custom Product
Page into the app; the paywall then continues *that* promise — someone who arrived on
"background remover" gets a background-remover paywall.

In this app the inputs already exist: onboarding captures `acquisitionSource` and `attPriming`,
and the headline already personalizes from `planIntent`. The tactic would be to prefer the
acquisition angle over the intent angle when the two disagree — e.g. arriving from a
sleep-keyword ad would lead with sleep even if the first intent picked was focus.

Why not now: it only pays off when keyword-level campaign data (ASA/AppsFlyer) is reliable
enough to drive copy, and it risks contradicting the intent the user just chose themselves —
which is the stronger signal. Revisit when ASA/CPP campaigns exist.

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

- **Refund assurance** on the final step, under the CTA: *"Not for you? You can ask Apple for
  a refund."* (handbook p. 43)
- **Everyday-price anchor** under the trial reminder toggle on the final step: *"Azora Pro
  is less than a coffee per month."* using the existing (previously unused) `trialNote`
  style (p. 36). It sits below the billing reminder rather than below the plan cards,
  because that is where the user is weighing what the plan costs after the trial
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
5. With the plan-card terms line gone, the annual card shows only a per-week figure until the
   store sheet states the real charge. Apple's sheet is authoritative, but guideline 3.1.2
   expects the app to disclose duration and price itself — worth a look before submission.
   Cheapest fix if needed: state the yearly charge on the coffee line under the trial toggle.
