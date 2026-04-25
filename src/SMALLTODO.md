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