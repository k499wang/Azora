# Coach & Programs Upsell — Placement Research (2026-11-02)

Goal: sell **human coaching** and **paid programs** as products separate from Azora Pro.
Delivery: push + in-app. Scope now: **UI only** (no SKU, no purchase wiring).

## What other apps do

| App | What's sold | Price | Where it lives | When it's pitched |
|---|---|---|---|---|
| Headspace | Text-based mental-health coach, 3 × 30-min sessions/mo | $99.99/mo, 50% off month 1 | Dedicated **"Care" tab**; coach shown as a "care team" member | Always-on tab; promo for new coaching users |
| Fabulous | 1:1 Personal Coaching (Google Meet, booked via Calendly) | Separate monthly plan | Coaching section inside Premium; booking hands off to external tools | **Post-purchase offer** right after Premium buy |
| Noom | Premium add-on: 1:1 coach + meal/exercise plans | ~$99/mo, billed as a second charge | Offered inside sign-up | **At sign-up**, to eligible users |
| Calm Health | Referral to coaching/therapy | Sponsor-paid | Recommendation after an in-app screening | After screening result |
| Duolingo Max | AI tier above Super | ~2× Super | Locked-feature teasers + upgrade screens | Mid-session; drew "pushy paywall" press; Max later closed to new users |

Patterns:
1. Human coaching is priced 5–10× the base plan and **billed separately**.
2. Two placement models: a **standing home** (Headspace tab) or a **moment** (Fabulous post-purchase, Noom sign-up, Calm post-screening).
3. Frequent upsells get punished in reviews (Fabulous, Duolingo). No app publishes conversion data — placement has to be A/B tested.

## Platform rules that shape the design

- **Apple 3.1.3(d) Person-to-Person Services:** real-time 1:1 services (coaching, tutoring, fitness training) may be sold **outside IAP** — no Apple commission. One-to-few/one-to-many live sessions and **pre-recorded program content must use IAP**. So: coaching can be a web checkout; paid programs need an App Store product.
- **Apple 4.5.4 promotional push:** push may only be used for promotions if the user **explicitly opted in via consent copy in our UI**, and we must offer an in-app opt-out. The existing reminder permission does not cover marketing pushes — needs its own toggle.

## Azora constraints

- Hard paywall: every user is already paying. This is a second purchase, not a conversion — tone must be "go further", never "unlock".
- Already 5 tabs (Home, Plan, Insights, Explore, Profile). A 6th tab breaks the iOS 5-tab bar (iOS moves the overflow into "More").
- Product is the Plan; Pro welcome screen is deliberately trusted-first with one CTA — stacking a coach offer there fights that.

## Placement options

| Option | Pros | Cons |
|---|---|---|
| A. New "Coach" tab (Headspace) | Always discoverable; signals seriousness | Needs a tab merged/removed; a tab of mostly sales content for most users |
| B. Shelf at top of Explore | Explore is already the "browse" surface; no nav change | Lower visibility than a tab |
| C. Plan milestone cards (e.g. day 7, plan complete) + matching push | Pitched at peak motivation, tied to the Plan | Only seen by engaged users |
| D. Post-purchase screen (Fabulous) | Highest-intent moment | Stacks two paywalls; conflicts with trusted-first Pro welcome |
| E. Profile row ("Work with a coach") | Zero friction to add | Low discovery |

## Recommendation

**B + C + E**, skip A and D for now:
1. Explore gets a "Coaching & Programs" shelf — the standing home, with a detail screen per offer.
2. Plan milestone card at day 7 and plan completion, mirrored by one push (only for users who opted into offers).
3. Profile row as the permanent fallback entry.
4. Settings: "Offers & coaching updates" push toggle (4.5.4 consent + opt-out).

Why: keeps the 5-tab bar, ties the pitch to Plan progress (the product), avoids the review backlash of frequent upsells. Revisit a Coach tab only if the shelf shows demand.

## Open questions

1. Who are the coaches and how are sessions delivered (in-app chat, video, external Calendly like Fabulous)?
2. Which paid programs exist at launch, and how long is each?
3. Frequency cap for in-app cards and pushes (suggest: max 1 coaching push/week, card dismissible for 14 days).

## Sources

- Headspace pricing: https://help.headspace.com/hc/en-us/articles/24292983551131
- Headspace enrollment via Care tab: https://help.headspace.com/hc/en-us/articles/25083776133659
- Headspace Care promo: https://headspace.com/care
- Fabulous Personal Coaching: https://help.thefabulous.co/en/support/solutions/articles/101000513389
- Fabulous upsell complaints: https://theliven.com/blog/wellbeing/dopamine-management/fabulous-app-review
- Noom Premium add-on: https://www.noom.com/support/faqs/using-the-app/daily-features/2025/10/what-is-the-premium-subscription/
- Calm Health referrals: https://www.ifebp.org/detail-pages/provider/calm-health
- Duolingo pushy paywall: https://www.fool.com/investing/2025/08/08/duolingos-pushy-paywall-play-smart-or-risky/
- Duolingo Max closed to new users: https://www.webull.com/news/15578528559678464
- Apple 3.1.3(d) discussion: https://developer.apple.com/forums/thread/723322
- Apple 4.5.4 promotional push: https://www.trustedreviews.com/news/apple-opens-floodgates-to-ads-from-apps-in-new-app-store-guidelines-3990935

## Reference screenshots

Saved in `docs/design/coach-upsell-references/` (App Store listings + Fabulous coaching page, 2026-11-02):

1. `1-headspace-care-tab.png` — Care tab: therapist face, price headline, one "Check my coverage" button; Care tab only in some builds.
2. `2-fabulous-coaching-pricing.png` — web upsell (`/journey-upsells/`): "Book your session", $67 first session, $87/mo after; 1 × 30-min Zoom/mo + email, Calendly booking.
3. `3-betterhelp-schedule.png` — month calendar, "Repeats weekly", hourly slot grid; Schedule is a bottom tab.
4. `4-trainwell-find-trainer.png` — wall of trainer photos + "Find My Trainer" after a short quiz.
5. `5-trainwell-coach-chat.png` — coach chat thread with workout cards inline.
