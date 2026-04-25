- the cleaner model is:
      - only configure/use RevenueCat when a user session exists
      - on user switch, call logIn(newUserId)
      - on sign-out, block purchase flows and clear your app’s local entitlement UI state
      - do not rely on RevenueCat anonymous mode at all

if we logout supabase
we don't log out rev cat
only logging in means we 

 - PostHog is analytics identity, so on logout you usually want to stop attaching future
    events to the previous user
  - RevenueCat is subscription identity, and in your app you only want known Supabase UUID
    users there, not anonymous fallback users

  So the correct behavior is:

  - Supabase signs in:
      - PostHog identifies user
      - RevenueCat uses that same Supabase user id
  - Supabase signs out:
      - PostHog resets
      - RevenueCat does not create an anonymous user
      - your app blocks subscription actions until another authenticated user signs in

  So yes, PostHog should reset on logout. RevenueCat should not. That split is intentional
  and correct for your setup.


1. Wire the real Supabase client at app bootstrap.
      - install/use @supabase/supabase-js
      - create the client once
      - call setSupabaseClient(...) before the auth identity sync runs
  2. Build the actual auth gate.
      - on launch, restore session
      - if no session, route to onboarding/auth
      - if session exists, route into the app
      - make sure tracking/paywall/protected screens are unreachable while signed out
  3. Create profile rows immediately after login.
      - your webhook only links RevenueCat events if profiles.user_id exists
      - do this right after auth success, before any paywall can be shown
      - use your existing DB function/pattern for profiles + user_preferences
  4. Wire RevenueCat for real.
      - use the env keys already added to app.config.js:40
      - keep the current identity model:
          - sign in -> RevenueCat tied to Supabase UUID
          - sign out -> app blocks purchases, no RevenueCat anonymous logout
  5. Add a minimal entitlement read path.
      - implement src/services/subscriptions/entitlementService.ts:17 to read
        user_entitlement_v
      - use RevenueCat getCustomerInfo() for immediate client-side purchase state
      - use user_entitlement_v as the backend truth
  6. Add one end-to-end sandbox test flow.
      - sign in
      - verify profiles row exists
      - verify RevenueCat getAppUserID() matches Supabase user.id
      - make a sandbox purchase
      - confirm:
          - revenuecat_events row written
          - subscriptions row updated
          - user_entitlement_v.is_pro = true
          - PostHog user is identified correctly
  7. Then start wiring actual feature reads/mutations.
      - streaks
      - home stats
      - heart-rate session upload
      - breath-hold session upload

  The most important immediate next step is Supabase client + auth gate + ensure profile
  exists after login. Without that, the RevenueCat/webhook path is structurally right but
  not actually live.

  If you want, I can implement that slice next.
