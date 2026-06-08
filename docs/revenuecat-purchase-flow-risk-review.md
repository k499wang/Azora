# RevenueCat Purchase Flow Risk Review

This note explains the current iOS purchase flow and the remaining edge-case risks.

## Current Expected Flow

For a clean first-time iOS purchase, the app-side path is expected to work:

1. The user opens a paywall.
2. Supabase auth sync configures RevenueCat with the Supabase user id.
3. The paywall waits until RevenueCat identity is synced.
4. The user buys an iOS subscription product.
5. RevenueCat uploads the receipt and returns `CustomerInfo`.
6. The app checks `customerInfo.entitlements.active['Azora  Pro']`.
7. If active, the app dismisses the paywall or completes onboarding.
8. RevenueCat later sends webhooks to Supabase.
9. Supabase `user_entitlement_v` becomes the durable app-gating source.

The highest-risk areas are not the StoreKit purchase call itself. They are the duplicate purchase entry guard and the backend subscription mirror after payment.

## Issue 1: Cancellation Can Remove Pro Too Early

Status: fixed in `supabase/functions/revenuecat-webhook/index.ts`. Cancellation without `expiration_at_ms` now preserves the existing `current_period_ends_at` instead of writing `now()`.

### User Flow

1. User buys Pro.
2. App unlocks Pro.
3. User later goes to Apple subscriptions and cancels renewal.
4. The user should keep Pro until the paid period ends.
5. RevenueCat sends a `CANCELLATION` webhook.
6. If that event has no `expiration_at_ms`, the current webhook sets `current_period_ends_at` to `now()`.
7. Supabase `user_entitlement_v` sees the period as expired.
8. The app can paywall the user even though Apple/RevenueCat still considers them entitled.

### Why It Matters

Normal subscription cancellation means "do not renew later", not "revoke access now". Access should usually be removed on `EXPIRATION`.

### Fix

- Do not use a `now()` fallback for ordinary `CANCELLATION`.
- Only use an immediate expiry fallback for `EXPIRATION`.
- If cancellation is missing `expiration_at_ms`, preserve the existing `current_period_ends_at` when possible.
- Longer term, mirror canonical RevenueCat subscriber state after webhook receipt instead of deriving final state from each event alone.

## Issue 2: Stale Webhooks Can Overwrite Newer State

### User Flow

1. User has Pro.
2. Subscription renews successfully.
3. RevenueCat sends a `RENEWAL` webhook with a future expiration.
4. Supabase updates the user to Pro.
5. An older webhook arrives late or is retried.
6. The webhook upserts the same `subscriptions` row without checking event order.
7. Supabase can be overwritten with stale state.
8. The app may later read `isPro = false` and lock the user out.

### Why It Matters

Webhook delivery is at-least-once and can be delayed. Duplicate event ids are handled, but ordering between different events is not guarded.

### Fix

- Add a stored timestamp such as `last_revenuecat_event_timestamp_ms` to `subscriptions`.
- Parse `event.event_timestamp_ms`.
- Only update the subscription row when the incoming event is newer than the stored timestamp.
- Keep logging every event in `revenuecat_events` for audit/debugging.

## Issue 3: Restore Or Transfer Can Fail To Mirror Correctly

### User Flow

1. User buys Pro.
2. Later they reinstall, change devices, or restore purchases under a different Supabase user id.
3. RevenueCat may transfer the purchase depending on project restore behavior.
4. RevenueCat sends a `TRANSFER` webhook.
5. Transfer webhooks do not have `app_user_id`.
6. The current webhook expects `app_user_id` before handling the event.
7. The app may unlock immediately from RevenueCat `CustomerInfo`, but Supabase may not mirror the transfer correctly.
8. On a later app boot or cache refresh, Supabase can still say the user is not Pro.

### Why It Matters

This is less likely during a clean first-time purchase, but it matters for restore purchases and support cases.

### Fix

- Add `transferred_from` and `transferred_to` handling to the webhook event type.
- Do not require `app_user_id` for `TRANSFER`.
- Resolve Supabase user ids from `transferred_to`, `transferred_from`, `original_app_user_id`, and `aliases` where applicable.
- Prefer fetching canonical RevenueCat subscriber state for the target user after a transfer.

## Issue 4: Duplicate Purchase Calls Can Produce Confusing Results

### User Flow

1. User taps purchase.
2. Before React has committed the disabled/loading state, another purchase call starts.
3. StoreKit/RevenueCat may finish one transaction and cancel or reject the other.
4. Logs can show a successful receipt upload followed by `Purchase was cancelled`.
5. Analytics can record both purchase-started and purchase-cancelled around a real purchase.

### Why It Matters

The UI mostly disables purchase buttons while busy, but `usePaywall.purchaseSelectedPackage()` does not have a synchronous in-flight guard. Two callers can still enter before state updates, especially across multiple paywall surfaces.

### Fix

- Add `useRef` guards for purchase and restore.
- Return early when a purchase or restore is already in progress.
- Clear the guard in `finally`.

Example shape:

```ts
const purchaseInFlightRef = useRef(false);

const purchaseSelectedPackage = async (): Promise<PaywallResult> => {
  if (purchaseInFlightRef.current) {
    return { status: 'not_presented', reason: 'not_ready' };
  }

  purchaseInFlightRef.current = true;
  setIsPurchasing(true);

  try {
    const result = await purchasePaywallPackage(selectedPackage);
    return result;
  } finally {
    purchaseInFlightRef.current = false;
    setIsPurchasing(false);
  }
};
```

## Practical Priority

1. Add the purchase/restore in-flight guard.
2. Change cancellation handling so cancellation does not revoke access early.
3. Add webhook event ordering protection.
4. Add transfer/restore mirror handling.
5. Add focused tests for purchase result handling and webhook state transitions.

## Verification Checklist

- First-time sandbox purchase unlocks immediately through `CustomerInfo`.
- `revenuecat_active_entitlement_ids` includes `Azora  Pro`.
- Paywall dismisses or onboarding completes after purchase.
- Supabase `subscriptions` row updates after webhook delivery.
- `user_entitlement_v.is_pro` becomes true.
- Cancelling renewal in Apple keeps Pro until expiration.
- Restore purchases keeps Supabase and RevenueCat aligned.
- Duplicate taps do not create overlapping purchase calls.
