# Azora App Store Approval Guide

This guide is tailored to the current Azora app as of April 11, 2026. The current app appears to store progress locally on the device and does not appear to use accounts, backend APIs, ads, analytics, tracking SDKs, camera, microphone, location, HealthKit, or user uploads.

Apple can still reject an app for bugs, incomplete metadata, misleading health claims, missing privacy information, or unsafe wellness guidance. Use this as a release checklist before each upload.

## Current Privacy Position

Use these App Store Connect answers only if the app stays as it is now:

- Data Collection: `No, we do not collect data from this app.`
- Tracking: `No.`
- Data Linked to the User: `None.`
- Data Not Linked to the User: `None.`
- Privacy Policy URL: required. Use a public URL that loads without login.
- User Privacy Choices URL: leave blank.

Why this is thgie right answer right now:

- Exercise progress is stored locally with AsyncStorage.
- The repo does not show ads, analytics, tracking SDKs, accounts, or a server upload path.
- The generated iOS privacy manifest declares no collected data.
- On-device-only data that is not sent off device is generally not treated as collected App Store privacy data.

Change these answers immediately if you add any of the following:

- Analytics, crash reporting, or session replay
- Ads or attribution SDKs
- Accounts, login, email collection, or cloud sync
- Push notifications tied to a user/account
- HealthKit, location, camera, microphone, contacts, photos, or files access
- Any backend API that receives progress, identifiers, IP-based analytics, or device metadata

## Privacy Policy

Create a public privacy policy page before submitting. Good options are:

- GitHub Pages
- A public Notion/Super page
- Your own website
- Any simple static hosting page that does not require login

Use this policy text and replace `YOUR_EMAIL_HERE` before publishing:

```text
Privacy Policy for Azora

Effective Date: April 11, 2026

Azora is a breathing and mindfulness app. We do not collect, sell, share, or track personal data.

Information We Store

Azora may store your breathing exercise progress and preferences locally on your device. This information stays on your device and is not sent to our servers.

Analytics, Advertising, and Tracking

Azora does not use advertising networks, third-party analytics, or tracking technologies. We do not track you across apps or websites.

Health Disclaimer

Azora provides general breathing and mindfulness exercises for wellness purposes only. It is not medical advice, diagnosis, or treatment. Stop any exercise if you feel discomfort, dizziness, shortness of breath, or pain, and consult a qualified healthcare professional if you have medical concerns.

Children's Privacy

Azora does not knowingly collect personal information from children.

Contact

If you have questions about this privacy policy, contact:
YOUR_EMAIL_HERE

Changes

We may update this privacy policy from time to time. Any changes will be posted on this page.
```

## App Store Connect Privacy Steps

1. Open App Store Connect.
2. Select the Azora app.
3. Go to `App Privacy`.
4. Add the Privacy Policy URL.
5. Start the privacy questionnaire.
6. Select `No, we do not collect data from this app`.
7. Confirm that the app does not track users.
8. Save and publish the privacy answers.
9. Re-check this section after every SDK or dependency change.

## Health and Wellness Approval Risk

Azora is safest when positioned as a general wellness and mindfulness app, not a medical app.

Do:

- Say `breathing practice`, `mindfulness`, `focus`, `relaxation`, and `wellness`.
- Include a safety disclaimer for breath holds.
- Tell users to stop if they feel discomfort, dizziness, shortness of breath, or pain.
- Tell users the app is not medical advice, diagnosis, or treatment.

Avoid:

- `Treats anxiety`
- `Cures anxiety`
- `Improves sleep disorders`
- `Therapy`
- `Clinical`
- `Medical`
- `Guaranteed results`
- Any claim that the app diagnoses, prevents, mitigates, or treats a condition

Recommended in-app safety copy:

```text
Azora is for general wellness and breathing practice only. It is not medical advice. Stop if you feel discomfort, dizziness, shortness of breath, or pain.
```

Recommended App Store description:

```text
Azora helps you follow simple breathing sessions, daily breath practice, and mindful routines. Choose a breathing rhythm, follow the guided circle, and track your daily practice locally on your device.

Azora is designed for general wellness and mindfulness. It is not medical advice, diagnosis, or treatment. Stop any exercise if you feel discomfort, dizziness, shortness of breath, or pain.
```

Recommended subtitle:

```text
Breathing and mindfulness practice
```

Recommended keywords:

```text
breathing,mindfulness,focus,calm,wellness,relaxation,breathwork
```

Do not put `anxiety`, `medical`, `therapy`, or `sleep disorder` in the keywords unless you are prepared for higher review scrutiny and have appropriate substantiation.

## Code and Metadata Fixes Before Upload

Do these before the first production upload:

1. Add a safety note in the app near breath-hold guidance.
2. Change `Calming technique for sleep and anxiety` to softer wording, such as `Calming breathing rhythm`.
3. Decide whether `Wim Hof` should stay. If it stays, avoid implying medical or performance benefits and add safety language because rapid breathing and breath holds can be sensitive.
4. Add `ios.buildNumber` to `app.json`, starting with `1`.
5. Increment the build number every time you upload another build to App Store Connect.
6. Keep `version` as `1.0.0` for the first release unless you intentionally want a different marketing version.
7. Confirm the icon is final and is not transparent. The current App Store icon source should be a 1024 x 1024 PNG.

Recommended `app.json` iOS block:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.k3vinwvng.BreathingAppInit",
  "buildNumber": "1"
}
```

## Build and Upload Path

Use EAS if you want the simplest Expo path:

```bash
npx eas build:configure
npx eas build -p ios --profile production
npx eas submit -p ios --latest
```

If EAS asks for Apple credentials, use the Apple Developer account that owns the app record in App Store Connect.

Before building, run:

```bash
npx tsc --noEmit
npm_config_cache=/tmp/brthe-npm-cache npx expo-doctor
```

The temporary npm cache avoids the current local issue where some npm cache files are root-owned.

Optional local permission cleanup:

```bash
sudo chown -R 501:20 "/Users/k3vinwvng/.npm-cache"
sudo chown -R "$USER":staff package.json node_modules
```

## App Store Connect Submission Checklist

Complete these fields:

- App name: `Azora`
- Subtitle: `Breathing and mindfulness practice`
- Category: `Health & Fitness` or `Lifestyle`
- Age rating: answer honestly; likely low age rating if there is no objectionable content, web access, user content, gambling, or medical treatment claims
- Privacy Policy URL: your published privacy policy page
- Screenshots: upload required iPhone screenshots; iPad screenshots may be required if tablet support stays enabled
- Description: use the recommended wording above
- Keywords: use the recommended keywords above
- Support URL: a public page or email/contact page
- Marketing URL: optional
- Review notes: add a short explanation

Recommended review notes:

```text
Azora is a general wellness breathing and mindfulness app. It does not require an account. It stores practice progress locally on the device and does not use ads, analytics, tracking, or external data collection. No login is needed for review.
```

## Final Pre-Submit Checks

Run the app on a simulator or device and verify:

- The app opens from a fresh install.
- There are no crashes on Home, Exercise, and Daily Exercise.
- The close/back behavior works.
- The breath-hold timer starts, releases, records, and resets.
- Text is readable on the smallest supported iPhone simulator.
- No screen makes medical promises.
- The privacy policy URL opens publicly.
- App Privacy answers are complete and published.
- The uploaded build number is higher than any previous uploaded build.

## Official Apple References

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App privacy details: https://developer.apple.com/app-store/app-privacy-details/
- App Store Connect privacy management: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
