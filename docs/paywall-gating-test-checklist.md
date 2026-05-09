# Paywall & Gating Test Checklist

Short, practical checklist for verifying payments, paywalls, and feature gating end to end. For the deeper RevenueCat-specific run, see `revenuecat-testing-checklist.md`.

## Setup

- [ ] Signed-in build with a valid RevenueCat API key (`src/services/subscriptions/revenueCatConfig.ts`).
- [ ] Console open — watch for `[hr-gate] useFeatureAccess` logs.
- [ ] Know your `appUserId` (matches Supabase user id).
- [ ] Have access to: RevenueCat dashboard, Supabase dashboard, App Store Connect Sandbox tester (iOS) or Play Internal Testing (Android).

## 1. Free-tier gating (no purchase)

- [ ] Fresh free user — open Heart Rate flow.
- [ ] Complete sessions up to the daily limit.
- [ ] Next attempt opens the paywall via `usePaywall`.
- [ ] Repeat for Daily Exercise.
- [ ] Reset: delete today's row in the daily usage table → gate reopens.

## 2. Pro gating (force entitlement, no payment)

- [ ] Grant a **Promotional Entitlement** in RevenueCat dashboard → Customer → Grant.
- [ ] Background + foreground the app.
- [ ] `[hr-gate]` log shows `isPro: true`.
- [ ] Pro-gated screens unlock; paywall no longer triggers.
- [ ] Revoke the promo → confirm gating returns after refresh.

## 3. Onboarding paywall

- [ ] New account, run onboarding to the paywall step.
- [ ] Paywall shows loading until RevenueCat status is `synced`.
- [ ] Offerings, price, and trial copy render correctly.
- [ ] Skip / dismiss path lands on the correct screen.

## 4. Purchase (sandbox)

- [ ] iOS: Sandbox Apple ID signed in (Settings → App Store → Sandbox Account).
- [ ] Android: install via Internal Testing track with license tester account.
- [ ] Select package → purchase → complete.
- [ ] App flips to Pro immediately (RevenueCat `CustomerInfo`).
- [ ] Supabase `user_entitlement_v` row updates after webhook.
- [ ] Cancel mid-purchase → app returns to paywall cleanly, no Pro unlock.

## 5. Restore

- [ ] On a second device / reinstall with the same store account, tap Restore.
- [ ] Pro re-enables without re-charging.
- [ ] Supabase entitlement query refreshes.

## 6. Foreground refresh

- [ ] While Pro, background the app for ~30s, foreground.
- [ ] Subscription bootstrap re-runs; entitlement query invalidates.
- [ ] No flicker of locked state.

## 7. Failure / retry

- [ ] Temporarily break the RevenueCat key in `revenueCatConfig.ts`.
- [ ] Open paywall → retryable error appears.
- [ ] Restore key → tap retry → status reaches `synced`.

## 8. Signed-out

- [ ] Sign out, force-close, reopen.
- [ ] No RevenueCat sync attempt; no "signed out" paywall errors.

## Pass criteria

- [ ] Free user hits the daily cap and sees the paywall.
- [ ] Pro user (real or promotional) bypasses every gate.
- [ ] Sandbox purchase unlocks Pro instantly and mirrors to Supabase.
- [ ] Restore works on a clean install.
- [ ] Foreground refresh keeps state in sync.
- [ ] Broken-key failure recovers via retry without restart.
