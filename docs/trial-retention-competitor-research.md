# Reducing Azora trial cancellations

Research date: October 20, 2026. Scope: current working-tree implementation, public competitor documentation, primary subscription-platform research, and an operator case study. No production analytics, competitor accounts, or live subscription configurations were inspected. Competitor features are documented behaviors, not proof of cancellation reduction.

## Main finding

Azora already has the core engagement mechanisms used by comparable apps: goal-specific plans, a guided first lesson, practical takeaways, follow-up usefulness feedback, reminders, progression, and companion/room rewards. Another generic onboarding or reward feature is not justified by this research. The strongest next opportunities are understanding cancellation timing, making billing control and reminder promises accurate, testing cancellation-screen messaging, and matching the trial decision to demonstrated value.

## Cancellation is a lifecycle event, not an explanation

[RevenueCat's 2026 report](https://www.revenuecat.com/state-of-subscription-apps/) reports that 39.8% of seven-day-trial cancellations occur on Day 0 and 64% during Days 0–1. These percentages are shares of cancellations, not shares of trial starters. The cross-app observational data does not establish why people cancel or predict Azora's results.

[RevenueCat's trial event flows](https://www.revenuecat.com/docs/integrations/webhooks/event-flows) distinguish cancellation from expiry: a user can turn renewal off and keep trial access until the end. Continued use, resumption, expiration, first payment, and billing failures must be analyzed separately. Early cancellation alone cannot distinguish avoiding an unwanted charge from rejecting the product.

## What comparable apps actually do

| App | Publicly documented mechanism | Comparison with Azora |
| --- | --- | --- |
| Liven | Users choose small commitments, check in, reflect, and adjust. [Official accountability page](https://theliven.com/accountability-app) | Azora already offers lesson actions, to-do handoff, and follow-up guidance. The useful question is whether trial users reach these steps. |
| Fabulous | Multi-week Journeys introduce habits gradually. Letters end in an action that joins the user's routine, supported by reminders. [Official Journey guide](https://help.thefabulous.co/en/support/solutions/articles/101000427409-what-is-a-journey-) | Azora already has structured learning and practice. Avoid treating more daily content as inherently more value. |
| Finch | A separate Plus preview activates after three days of app use, ends without a charge, and requires no cancellation. [Official preview guide](https://help.finchcare.com/hc/en-us/articles/38087066022285-Finch-Plus-Preview-Explained) | This separates experiencing premium value from accepting automatic renewal. It is distinct from Finch's conventional subscription trial and is a different acquisition model, not a cosmetic paywall change. |
| Headspace | With consent, Apple Health sleep data informs Today recommendations and bedtime wind-down reminders. [Official integration page](https://www.headspace.com/integrations/apple) | The principle is present-day relevance. Azora already uses goals and lesson feedback; carrying that feedback into the next Home action is a smaller hypothesis than adding health integrations. |
| Calm | Premium includes a fresh Daily Calm theme and a differentiated content library; users can also sample the first day of programs. [Premium guide](https://support.calm.com/hc/en-us/articles/360008536834-Calm-Premium-vs-Free-Features-Content-List-Benefits), [free-content guide](https://support.calm.com/hc/en-us/articles/360044707294-What-Free-Content-is-Available-on-the-Calm-App) | Azora already previews upcoming plan content. The remaining hypothesis is whether users understand what continuing their paid plan provides beyond the trial. |

These companies do not publicly establish the cancellation impact of the features above. Do not describe any as a proven retention formula.

## More direct intervention evidence

Mimo's former growth lead describes adopting a clear Blinkist-style trial explanation: trial opt-ins more than doubled and trial-to-purchase conversion improved by 50%. Expiration reminders did not have a strong negative cancellation effect. This is a firsthand operator account in a different category, without disclosed sample sizes or confidence intervals; it cannot predict Azora's lift. The same account describes shortening a long trial alongside better communication of content depth. Longer is not automatically better. [Mimo case study, May 2026](https://www.revenuecat.com/blog/growth/optimize-funnel-metrics-mimo/)

Azora already has a timeline and optional reminder. The actionable difference is making the promise match the actual permission and scheduling state, not adding another explainer by default.

## Apple cancellation-screen messaging

Apple documents Retention Messaging that displays benefit messaging, images, or offers in the system subscription-cancellation flow. WWDC26 distinguishes configuration in App Store Connect from a real-time server API; the latter can also select a switch-plan view. [Apple WWDC26 walkthrough](https://developer.apple.com/videos/play/wwdc2026/309/), [real-time documentation](https://developer.apple.com/documentation/retentionmessaging/responding-to-realtime-retention-messaging-requests)

RevenueCat supports the real-time route, but its documentation still requires Apple access approval. Dashboard availability and trial/offer eligibility must be checked for Azora's account before planning implementation. Static configuration does not inherently require building a new custom server. [RevenueCat integration](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-retention-messaging-api)

Test a factual reminder of continued benefits before testing discounts. Do not claim access disappears immediately when a trial's renewal is canceled. Evaluate eventual paid conversion and revenue, not simply closing the cancellation sheet. [RevenueCat experiment measurement](https://www.revenuecat.com/docs/tools/experiments-v1/experimenting-with-retention-messaging)

## Existing Azora implementation and concrete gaps

- First lesson and skippable Home tour: `src/features/tour/tourSteps.ts`; `src/screens/HomeScreen.tsx`.
- Lesson actions, smaller attempts, clarification, and usefulness reports: `src/features/lessons/LessonPractice.tsx`; `src/screens/LessonScreen.tsx`.
- Practiced skills and actual progress: `src/screens/ProfileScreen.tsx`; `src/features/plan/LearningPracticeSummary.tsx`. Practice reports are device-local, per `docs/architecture/learning-practice.md`; they are not automatically a server-side conversion dataset.
- Goal-specific daily reminders and optional trial reminder already exist. `src/services/notifications/types.ts` defaults the trial reminder off. `PaywallFreeTrialHeroStep.tsx` promises a reminder. Permission and scheduled-state confirmation should govern that promise.
- Settings currently renders Restore purchases under Subscription, without a trial status or manage-subscription row. The entitlement model already exposes trial expiry and renewal status. A clear status surface is a concrete possible addition, not an existing feature to duplicate.
- Trial-ending notification copy says the trial renews, while scheduling receives the expiry date without renewal status. Review canceled-trial messaging so an opted-out user is not told an automatic charge is coming.
- Complete RevenueCat payloads and linked users are logged in `supabase/functions/revenuecat-webhook/index.ts`. Lesson opened/read events exist in `src/services/analytics/tracking.ts`.
- The qualified-trial marketing signal is a ten-minute survival gate. It does not measure trial-to-paid conversion or realized value.

## Recommended investigation and experiment order

1. Use mature production trial cohorts. Separate free trials from paid introductory offers, sandbox activity, and synthetic marketing events. Measure time to cancellation, access expiry, uncancellation, and first paid renewal. Segment by product, offering, goal, market, and acquisition source.
2. Compare activation and post-cancellation activity: first lesson read, next-day return, and completed plan activity. Keep conversion windows consistent. A cancellation reason such as UNSUBSCRIBE does not reveal the user's motivation.
3. Correct reminder/renewal statements regardless of experiment results. Then test a truthful trial-status surface with actual billing date, renewal status, reminder state, and subscription management. Billing anxiety is a hypothesis to validate, not an established Azora cause.
4. Check Apple Retention Messaging availability. Test a specific benefit message with a holdout. Consider a lower-commitment plan only when its eligibility and billing terms are verified; discounts are a separate experiment.
5. If cancellations cluster before first use, test experiencing one representative lesson/action before the automatically renewing trial decision. Finch supplies a model, not evidence of a guaranteed improvement. Count paid customers and revenue per new user so fewer trial starts cannot masquerade as success.
6. If engaged users cancel later, investigate price, unmet expectations, or lack of perceived continuing value. A renewal-time recap can reuse recorded skills, user helpfulness, and actual upcoming lessons. It must not infer improved health from completing content.

Ask canceling users a brief optional reason question when an appropriate channel exists; none was sent during this research. Distinguish avoiding automatic renewal, price, time, irrelevant content, and no perceived benefit.

Primary success: mature trial-to-paid conversion and revenue per new user. Guardrails: refunds, complaints, subsequent retention, and completion/engagement. No cancellation strategy was deployed and no production experiment was changed.
