# RevenueCat Testing Checklist

Use this checklist to verify the RevenueCat and Supabase changes end to end.

## Before You Start

- [ ] Run the app with a signed-in Supabase account.
- [ ] Use a build that has the correct RevenueCat API key configured.
- [ ] Confirm you can see dev logs in the console.
- [ ] Confirm you know whether you are testing a real purchase flow or sandbox.
- [ ] Keep the `docs/revenuecat-supabase-paywall-guide.md` file open while testing.

## 1. App Boot

- [ ] Force close the app.
- [ ] Reopen the app.
- [ ] Confirm Supabase restores the session.
- [ ] Confirm RevenueCat identity moves through `syncing` to `synced`.
- [ ] Confirm the app does not show `RevenueCat is unavailable while signed out`.
- [ ] Confirm the app does not crash with `this.setLogHandler is not a function`.
- [ ] Confirm the debug snapshot shows the same Supabase user id and RevenueCat app user id.

Expected result:

- RevenueCat should be synced automatically on boot for a signed-in user.
- The app should continue normally into the signed-in flow.

## 2. Signed-Out Boot

- [ ] Sign out.
- [ ] Force close the app.
- [ ] Reopen the app.
- [ ] Confirm the app goes to the signed-out screen.
- [ ] Confirm RevenueCat status becomes `signed_out`.
- [ ] Confirm no paywall or subscription fetch runs for a signed-out user.

Expected result:

- Signed-out users should not see RevenueCat errors.
- Signed-out users should not get a paywall sync attempt.

## 3. Onboarding Paywall

- [ ] Sign in with a fresh account that has not completed onboarding.
- [ ] Finish onboarding until the paywall appears.
- [ ] Confirm the paywall stays loading while RevenueCat is syncing.
- [ ] Confirm offerings appear only after RevenueCat status is `synced`.
- [ ] Confirm the paywall does not show a misleading signed-out message.
- [ ] Confirm the selected package, price, and trial text render correctly.

Expected result:

- The paywall should wait for RevenueCat sync and then load the offering.

## 4. Retry Flow

- [ ] Temporarily force a RevenueCat sync failure if you can.
- [ ] Open the paywall.
- [ ] Confirm the paywall shows a retryable error.
- [ ] Tap the retry button.
- [ ] Confirm the app attempts RevenueCat sync again.
- [ ] Confirm the status changes from `failed` back to `syncing` and then `synced` if the retry succeeds.

Expected result:

- A temporary RevenueCat failure should be recoverable without restarting the app.

## 5. Purchase Flow

- [ ] Open the paywall.
- [ ] Select a package.
- [ ] Start a purchase.
- [ ] Confirm the UI shows the purchasing state.
- [ ] Complete or cancel the purchase.
- [ ] If purchase succeeds, confirm the app sees `pro` immediately from RevenueCat `CustomerInfo`.
- [ ] Confirm the Supabase entitlement query is invalidated or refreshed after purchase.
- [ ] Confirm the webhook later mirrors the subscription into `subscriptions` and `user_entitlement_v`.

Expected result:

- Pro access should unlock immediately after a successful purchase.
- Supabase should catch up through the webhook mirror.

## 6. Restore Flow

- [ ] Open the paywall on a device/account that already has a subscription.
- [ ] Tap restore purchases.
- [ ] Confirm the restore state appears.
- [ ] Confirm the app recognizes Pro access if the subscription is active.
- [ ] Confirm the Supabase entitlement query refreshes after restore.

Expected result:

- Restore should re-enable Pro access without a fresh purchase.

## 7. App Foreground Refresh

- [ ] Open the app while signed in.
- [ ] Send the app to the background.
- [ ] Bring the app back to the foreground.
- [ ] Confirm the subscription bootstrap runs again.
- [ ] Confirm RevenueCat customer info refreshes.
- [ ] Confirm the Supabase entitlement query is invalidated.

Expected result:

- Foregrounding the app should refresh subscription state automatically.

## 8. Pro Gate Check

- [ ] Open a screen that depends on Pro access.
- [ ] Confirm it reads the Supabase entitlement query, not RevenueCat directly.
- [ ] Confirm it still works if RevenueCat is temporarily slow.
- [ ] Confirm Pro stays unlocked if Supabase still says the user is Pro.

Expected result:

- Normal Pro checks should be stable even when RevenueCat is not available in the moment.

## 9. Debug Signals

- [ ] Check `revenuecat_status`.
- [ ] Check `revenuecat_current_app_user_id`.
- [ ] Check `revenuecat_ready`.
- [ ] Check `revenuecat_last_error`.
- [ ] Check `revenuecat_last_synced_at`.
- [ ] Check `supabase_user_id`.
- [ ] Check `auth_status`.

Expected result:

- You should be able to tell whether the problem is auth, RevenueCat sync, config, or the webhook mirror.

## If Something Fails

- [ ] If the app says signed out, verify the Supabase session first.
- [ ] If the app says RevenueCat failed, verify the SDK logs and API key.
- [ ] If the paywall never loads, verify RevenueCat status reaches `synced`.
- [ ] If purchase succeeds but Pro does not unlock, verify the entitlement query and webhook mirror.
- [ ] If restore works in RevenueCat but not in the app, verify the Supabase entitlement refresh.

## Pass Criteria

The change is working if all of these are true:

- [ ] Signed-in boot syncs RevenueCat automatically.
- [ ] Signed-out boot does not try to use RevenueCat.
- [ ] Paywall waits for sync before loading offerings.
- [ ] Retry recovers from a temporary RevenueCat failure.
- [ ] Purchase unlocks Pro immediately.
- [ ] Restore unlocks Pro correctly.
- [ ] Foreground refresh updates subscription state.
- [ ] Pro checks use Supabase entitlement and stay stable if RevenueCat is temporarily unavailable.
