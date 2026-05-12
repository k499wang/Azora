# App Store Review — Required Information

Reply in App Store Connect with all of the following information:

1. A screen recording captured on a physical device, running the latest operating system, demonstrating the app's functionality. The recording must begin with launching the app and show the typical user flow through its core features. If the app has any of the following, include them in the recording:

   - Account registration, login, and account deletion flows
   - Accessing paid content or features within the app, including any purchase or subscription flows
   - User-generated content, including content reporting and blocking mechanisms
   - Any prompts requesting access to sensitive data or device capabilities (for example, location, contacts, camera, or App Tracking Transparency)

2. A list of the device models and operating systems the app was tested on before submitting for review
3. A description of the app's purpose and target audience, including the problem it solves and the value it provides
4. Instructions for setting up and accessing the app's main features, including any required login credentials or sample files
5. A list of the external services, tools, or platforms the app uses to deliver its core functionality (for example, data providers, authentication services, payment processors, or AI services)
6. Describe any regional differences in the app's features or content, or confirm that the app functions consistently across all regions
7. If the app operates in a highly regulated industry or includes protected third-party material, provide any relevant documentation or credentials to demonstrate you are authorized to provide these services or protected material

Include this information in the Notes field of the App Review Information section in App Store Connect for future submissions.

---

## Response Draft

**1. Screen Recording**

A screen recording will be attached showing the following flow on a physical iPhone running the latest iOS:

- Cold app launch
- Account registration via Apple Sign-In and Google Sign-In
- 18-step onboarding (including baseline heart rate capture using the camera)
- Subscription/paywall screen with purchase flow (weekly and annual plans)
- Core app features: breathing exercise session, heart rate monitoring, session history and HRV stats
- Account deletion flow (accessible via Profile → Settings → Delete Account)
- Camera permission prompt (triggered during heart rate capture)
- Photo library permission prompt (triggered during profile photo selection)

---

**2. Devices & OS Tested**

- iPhone 15 Pro — iOS 18.x (latest)
- iPhone 14 — iOS 17.x
- iPhone SE (3rd gen) — iOS 17.x

---

**3. App Purpose & Target Audience**

Azora is a guided breathing and heart rate monitoring app designed for adults seeking stress reduction, improved focus, better sleep, and general wellness. Users are guided through science-backed breathing techniques (Box Breathing, 4-7-8, Wim Hof, Resonance Breathing) and receive real-time heart rate and HRV (Heart Rate Variability) biofeedback using their iPhone's rear camera. The app solves the problem of inaccessible biofeedback tools by turning any iPhone into a portable HRV monitor paired with a structured breathing practice program.

---

**4. Setup & Access Instructions**

To access the app as a reviewer:

1. Download and open Azora
2. Tap "Continue with Apple" or "Continue with Google" to create an account (no manual username/password — OAuth only)
3. Complete the onboarding flow (~3–5 minutes): answer wellness questions, perform a baseline heart rate measurement by placing your fingertip over the rear camera
4. At the end of onboarding, you will see the subscription paywall — you may tap "Continue for free" to use the free tier, or proceed with a purchase to access Pro features
5. From the Home tab: tap any breathing technique card to start a guided session, or tap "Daily Exercise" to begin a breath hold with live heart rate monitoring

**Test credentials (Sandbox reviewer account):**

- Sign in using Apple Sign-In with a sandbox Apple ID, or use Google Sign-In with any Google account
- No pre-loaded credentials are required — the app uses OAuth exclusively and creates a new profile automatically on first sign-in
- After Sign in with Apple, users are not required to provide their name or email address. The onboarding name field is optional and can be skipped.

**To test account deletion:**

- Navigate to the Profile tab → Settings → Delete Account → confirm deletion
- All user data is permanently removed from our servers (Supabase cascade delete)

---

**5. External Services Used**

| Service | Purpose |
|---|---|
| Supabase | Backend database, user authentication sessions, profile storage, session history, account deletion |
| RevenueCat | In-app purchase management for iOS App Store subscriptions (weekly and annual plans) |
| PostHog | First-party product analytics, feature flag management, and debugging. Events are linked only to the app's internal user ID; Azora does not send name or email to PostHog. |
| Apple Sign-In | OAuth authentication (Sign in with Apple) |
| Google Sign-In | OAuth authentication via Google |
| Expo / EAS | App build and deployment infrastructure |

No third-party AI services are used. No advertising SDKs are used. The app does not use IDFA, does not share user data with data brokers, and does not use PostHog or any other service for cross-app tracking, targeted advertising, or third-party advertising measurement.

---

**6. Regional Differences**

The app functions consistently across all regions. There are no geo-restricted features, region-specific content, or localized pricing outside of standard App Store pricing tiers. Subscription pricing is set in USD ($59.99/year or weekly) with App Store automatic currency conversion for international users.

---

**7. Regulated Industry / Third-Party Material**

Azora is a wellness app and does not provide medical advice, diagnosis, or treatment. The app's heart rate and HRV readings are intended for general wellness purposes only, not clinical use, and this is disclosed to users within the app.

The app does not include any third-party copyrighted material. All breathing technique descriptions are original content. No HealthKit or medical device integrations are used.

The camera is used solely for photoplethysmography (PPG) heart rate detection — finger-on-lens measurement — which is a well-established non-medical wellness technique. No images or video are recorded or stored.
