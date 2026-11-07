# State machines

Audited 2026-11-07 by reading the code and the installed `@supabase/auth-js` 2.104.1.
Tests prove the pure logic. Nothing here has been run on a device.

Update this file in the same change as any new state, transition, or guard.

## Audit coverage

| Depth | Machines |
| --- | --- |
| Traced for invalid states, retries, and concurrency | SM-1 to SM-13 |
| Listed, not audited | Section "Other machines" |

## Issues

Ranked by impact. These are tracked here, not on GitHub.

| Issue | Priority | Status | Summary |
| --- | --- | --- | --- |
| [AZ-SM-1](#az-sm-1-auth-boot-treats-no-answer-as-a-rejected-session) | P0 | Fixed, device check pending | Offline launch sticks on the splash. A slow launch signs the user out. |
| [AZ-SM-2](#az-sm-2-the-sdks-can-disagree-with-the-signed-in-account) | P1 | Fixed | RevenueCat and PostHog can hold the wrong account, or a deleted one. |
| [AZ-SM-3](#az-sm-3-the-boot-paywall-latch-ignores-the-account) | P2 | Fixed | The first account spends the boot paywall for the next account. |
| [AZ-SM-4](#az-sm-4-an-unreadable-photo-strands-photo-cleanup) | P2 | Fixed | An unreadable photo leaves a permanent spinner or no feedback. |

### AZ-SM-1: Auth boot treats no answer as a rejected session

**Bugs (SM-1)**

1. **Offline launch never leaves `booting`.** `getUser()` returned a network error, and the validator
   returned `false`. `signOut()` then failed on the same network and threw. `initialize()` rejected
   before `applySession` and before the auth subscription, so the splash stayed until a force quit.
2. **A slow launch signs the user out.** A validation slower than 5 seconds counted as `false`. When the
   later sign-out reached the server, it ended a valid session.

**Evidence:** `_signOut` in `node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:3159` returns the
error and keeps the session for anything except 401, 403, and 404. `lib/fetch.js:23` reports a network
failure as `AuthRetryableFetchError` with status 0.

**Fix:** `validateCurrentSession` returns `valid`, `invalid`, or `unknown`, and only a 4xx rejection is
`invalid` (408 and 429 are `unknown`). `resolveBootSession` keeps the session unless it is `invalid`, and
a failed sign-out can no longer block the transition out of `booting`.

**Tests:** `src/stores/authTransitions.test.mjs`, `src/services/supabase/auth.test.mjs`.

**Device check:** Launch a signed-in build in airplane mode. Expect "We couldn't connect", not the splash.

**Accepted result:** A revoked session stays signed in on the device until the next online launch. Server
requests still fail during that time.

### AZ-SM-2: The SDKs can disagree with the signed-in account

**Bugs (SM-2, SM-3)**

1. **A stale sign-in overwrites the current state.** `syncSessionIdentity` had no generation check. If a
   user signs out during a slow `ensureProfile`, the old sign-in continues. It identifies the old user in
   PostHog and logs the old user into RevenueCat. If account B signed in meanwhile, RevenueCat ends on
   account A, so a purchase by B can go to A.
2. **Account deletion skipped the auth client.** `deleteAccount` changed the store only. The client kept
   its session and emitted no `SIGNED_OUT`, so `onUserSignedOut` never ran. PostHog stayed identified as
   the deleted user, and RevenueCat kept that identity.

**Fix:** Each identity change supersedes the previous one, and each step checks this after every `await`.
`finishAccountDeletion` calls the new `signOutLocal`, then applies the signed-out state even if that call
fails.

**Tests:** `src/services/supabase/authIdentitySync.test.mjs` (all three race tests fail without the fix),
`src/stores/authTransitions.test.mjs`.

**Accepted result:** If `signOutLocal` fails offline, SDK identities clear at the next launch that can
reach the server.

### AZ-SM-3: The boot paywall latch ignores the account

**Bug (SM-6):** `hasPresentedBootPaywall` was one module-level boolean. After account A saw the boot
paywall, a sign-out and a sign-in as non-Pro account B in the same launch showed B no paywall. This
includes the blocking hard paywall.

**Fix:** `bootPaywallLatch` stores the account that used the latch.

**Test:** `src/app/navigation/bootPaywallLatch.test.mjs`.

### AZ-SM-4: An unreadable photo strands photo cleanup

**Bug (SM-10):** `void prepareAsset(asset)` had no failure path when `manipulateAsync` rejected or returned
no base64. An iCloud-only original is one possible cause.

- From `checkingAccess`, the stage stayed there and the spinner never ended. `selectedAsset` was already
  cleared, so the effect could not run again.
- From `capture`, the user saw nothing and the rejection was unhandled.

**Fix:** `prepareCleanupPhoto` routes every failure back to `capture` with a message.

**Test:** `src/features/photoCleanup/domain/prepareCleanupPhoto.test.mjs`.

## Open findings

These are not fixed. Each one is unconfirmed or low impact.

| Machine | Finding | Status |
| --- | --- | --- |
| SM-11 | `cancel()` calls `abort()`, whose `end` event can arrive late. `end` carries no session ID, so a fast restart could move the new recording to `idle` while the microphone runs. | Unconfirmed. Needs a device check of native event timing. |
| SM-5 | `retryRevenueCatSync` sets `isLoading` when the status is `unavailable`. The status does not change, so the effect does not rerun and the spinner stays. | Confirmed by reading. Only builds without an API key or on an unsupported platform can reach it. |
| SM-2 | If `ensureProfile` fails, `lastIdentityKey` is already set, so the same user is not retried. PostHog stays unidentified until the next launch. RevenueCat recovers through `useSubscriptionBootstrap`. | Confirmed by reading. Low impact. |
| SM-10 | A late 403 from `createPhotoCleanupPlan` opens the paywall after the user has left the screen. | Confirmed by reading. Low impact. |
| SM-1 | If the server rejects a session and the sign-out then fails, `INITIAL_SESSION` can restore `signed_in`. The next launch validates again. | Rare. Needs a rejection, then a network loss. |
| SM-1 | A session read slower than 8 seconds shows `signed_out` until `INITIAL_SESSION` arrives. | Recovers without action. |
| SM-1 | A sign-out while offline shows "Sign out failed" and stays signed in. | Valid state with a visible error. |

**Checked and not a bug**

- A seal retry cannot duplicate starter to-dos, because `createSelfCareGoals` removes duplicates by identity.
- Plan enrollment has a unique active index, and the server locks the row when it advances a day.
- To-do claims have ref and mutation guards, and the server decides the day.
- `spendCoins` checks the balance and then writes, so it could overdraw. Nothing calls `useSpendCoinsMutation` today.
- `useRoutineRunCoins` refuses a double payment in one run. A failed grant is not retried automatically.
- The home card `hydrate` race needs a `clear()` during a storage read at mount, and no caller does that.

## Machines

### SM-1: Auth session

**Owner:** `src/stores/authStore.ts`, `src/stores/authTransitions.ts`

**States:** `booting`, `signed_out`, `signed_in`

**Invariants**

- `status === 'signed_in'` if and only if `session != null`, and `user === session.user`.
- `initialize` runs once per process and always leaves `booting`.
- Only a server rejection ends a session at boot.

| From | Event | Guard | To |
| --- | --- | --- | --- |
| `booting` | Session read finds nothing, fails, or takes over 8 s | | `signed_out` |
| `booting` | Validation is `valid` or `unknown` | | `signed_in` |
| `booting` | Validation is `invalid` | Sign-out attempted | `signed_out` |
| `signed_out` | Google or Apple sign-in succeeds | | `signed_in` |
| any | Auth event with a session | Listener registered | `signed_in` |
| any | Auth event without a session | Listener registered | `signed_out` |
| `signed_in` | `deleteAccount` succeeds | | `signed_out` |
| `signed_in` | `signOut` fails | Alert shown | `signed_in` |

### SM-2: Identity sync

**Owner:** `src/services/supabase/authIdentitySyncCore.ts`

An implicit machine, keyed by `lastIdentityKey` and `identityGeneration`.

**States:** No identity, `signed_out`, or a user ID, with an in-flight sync for at most one generation.

**Invariants**

- Only the newest generation may run side effects after an `await`.
- The order is profile, PostHog, then RevenueCat.
- `TOKEN_REFRESHED` never starts a sync. `USER_UPDATED` always does.

| Event | Guard | Effect |
| --- | --- | --- |
| Same identity key | Not `USER_UPDATED` | Ignored |
| Session is null | Key changed | PostHog reset, AppsFlyer and RevenueCat cleared, status `signed_out` |
| Session for a user | Key changed | Profile, then PostHog, then RevenueCat |
| Older sync resumes | Generation superseded | Stops silently, with no status or warning |

### SM-3: RevenueCat identity

**Owner:** `src/stores/revenueCatIdentityStore.ts`, `src/services/subscriptions/revenueCatIdentitySync.ts`,
`revenueCatClientCore.ts`

**States:** `idle`, `syncing`, `synced`, `signed_out`, `unavailable`, `failed`

**Invariants**

- `synced` means `appUserId` equals the signed-in user and the SDK's current ID.
- `runSerial` orders identity calls, and a failed call does not block the next one.
- A result is discarded if the signed-in user changed during the call.

| From | Event | To |
| --- | --- | --- |
| any | `ensure` with no user, or `onRevenueCatSignedOut` | `signed_out` |
| any | RevenueCat unavailable | `unavailable` |
| not `synced` for this user, or forced | `ensure` starts | `syncing` |
| `syncing` | Sync succeeds for the current user | `synced` |
| `syncing` | Sync fails for the current user | `failed` |
| `syncing` | User changed | No change here. The next identity event sets the status. |
| `synced` | Customer info read fails | `failed` |

### SM-4: App gate

**Owner:** `src/hooks/appGateCore.ts`, `src/hooks/useAppGate.ts`, `RootNavigator`

A derived machine. `computeAppGate` is pure, and the first matching row wins.

**States:** `booting`, `signed_out`, `connection_error`, `needs_onboarding`, `ready`

| Condition | Gate |
| --- | --- |
| Auth is `booting` | `booting` |
| Auth is `signed_out`, or no user | `signed_out` |
| Onboarding status unread | `connection_error` on error, else `booting` |
| Onboarding status is true | `ready` |
| Saved profile unread | `connection_error` on error, else `booting` |
| Saved profile exists, and entitlement is loading or auto-complete is running | `booting` |
| Otherwise | `needs_onboarding` |

**Invariants**

- During `booting` or `connection_error`, `RootNavigator` keeps the last onboarding gate on screen, so a
  refetch cannot reset the flow.
- `signed_out` and `ready` clear that gate.
- Auto-complete runs once per user, and only for a Pro user with a saved profile from an earlier run.

### SM-5: Purchase and restore

**Owner:** `src/hooks/usePaywall.ts`, `src/services/paywall/paywallService.ts`

**Result states:** `purchased`, `restored`, `cancelled`, `not_presented`, `failed`

| From | Event | Guard | To |
| --- | --- | --- | --- |
| Idle | Purchase tap | Same user, UI not busy | `isPurchasing` |
| `isPurchasing` | Attribution sync settles | User changed | `not_presented` |
| `isPurchasing` | Store result | User unchanged | `purchased` |
| `isPurchasing` | Store result | User changed | `not_presented` (`signed_out`) |
| `isPurchasing` | Store sheet cancelled | | `cancelled` |
| `isPurchasing` | Error | | `failed`, with a message |
| Idle | Restore tap | Same user, UI not busy | `isRestoring`, then the same results |

**Invariants**

- The entitlement is written before the paywall closes.
- A pre-purchase read cannot overwrite a confirmed result, because `publishRevenueCatEntitlement` cancels
  in-flight reads.
- A result is only published when the auth user and the RevenueCat user both match the buyer.

### SM-6: Boot paywall

**Owner:** `RootNavigator` (`BootPaywallGate`, `BootPaywallPresenter`), `bootPaywallLatch.ts`

**States:** Waiting for entitlement, resolving mode, presented, or dropped.

**Invariants**

- At most one presentation per account per launch.
- Pro users and failed entitlement reads never see it.
- If the identity or offering fails, the mode falls back to `soft`, so a failure cannot lock anyone out.
- If a route is already above the tabs, the presentation is dropped and not queued.

| From | Event | To |
| --- | --- | --- |
| Waiting | Non-Pro confirmed, RevenueCat `failed`, `unavailable`, or `signed_out` | `soft` |
| Waiting | Non-Pro confirmed, identity not settled after 6 s | `soft` |
| Waiting | Offering loaded | Offering's mode |
| Mode set | Tab root on top, latch unused for this user | Presented |
| Mode set | Another route on top, latch unused | Dropped, latch used |

### SM-7: Onboarding

**Owner:** `src/components/onboarding/OnboardingFlow.tsx`, `onboardingStepOrder.ts`

**States:** The step order, then `pact`, `paywall`, and the `ProWelcome` overlay. `sealInFlightRef`,
`isSubmitting`, and `finishedToHomeCardRef` are guards.

| From | Event | Guard | To |
| --- | --- | --- | --- |
| Step | Continue or skip | | Next step |
| `pact` | Seal | No seal in flight | Saving |
| Saving | Writes and celebration finish within 20 s | | `paywall` |
| Saving | Failure or timeout | | `pact`, with an error and a retry |
| `paywall` | Purchase with Pro | | `ProWelcome` |
| `ProWelcome` | Continue | | Finish |
| `paywall` | Restore with Pro | | Finish |
| `paywall` | First store cancel | No offer shown yet | Exit offer sheet |
| `paywall` | Continue free | Not hard mode, or already Pro | Finish |
| `paywall` | `home_card` layout, non-Pro | One attempt | Card saved, then finish |
| Finish | `onComplete` fails | | `paywall`, with an error |

**Invariants**

- The profile save is the last write, because it is the recovery marker.
- `home_card` falls back to the paywall steps on a failed finish.
- The special offer shows at most once (App Review).

### SM-8: App tour

**Owner:** `src/features/tour/tourStore.ts`, `useAppTour.ts`

**States:** `checking`, `running`, `closing`, `finished`, plus `stepIndex`, `completed`, and `handedOff`

**Invariants**

- `stepIndex != null` only while `running`.
- `completed` is read once.
- A stale `setTourSeen` cannot move a newer run, because of `lifecycleGeneration`.
- Post-tour presenters wait for `finished` and `handedOff === false`.

| From | Event | To |
| --- | --- | --- |
| any | `prepare` | `checking` |
| `checking` | Seen flag is true, or `dismiss` | `finished` |
| `checking` | Seen flag is false, `start` | `running` |
| `running` | `next`, not the last stop | `running` |
| `running` | `next` on the last stop, or `stop` | `closing` after the flag saves |
| `running` | `finishByPress` | `closing`, with `handedOff` |
| `running` | `abort` (flag not saved) | `closing` |
| `closing` | `completeClosing` | `finished` |

### SM-9: Plan enrollment and day

**Owner:** `src/features/program/domain/programEnrollment.ts`, migrations under `supabase/migrations/`

**States:** `active`, `completed`, `abandoned`, plus `programDay` and `lastAdvancedOn`

**Invariants**

- One active enrollment per user (`program_enrollments_one_active_idx`).
- At most one advance per local date.
- A completion counts once per activity (`on conflict do nothing`).
- A finished day stays on screen until the date changes (`programDayForDate`).

| From | Event | Guard | Result |
| --- | --- | --- | --- |
| `active` | Evidence matches, activities remain | Not advanced today | `recorded` |
| `active` | Last activity, not the last day | Not advanced today | `advanced`, day + 1 |
| `active` | Last activity, last day | Not advanced today | `completed` |
| `active` | Already advanced today | | Refused |
| `active` | Evidence does not match | | Refused, with no plan change |
| `completed` or `abandoned` | Any evidence | | Refused |

**To-do step:** `todoStepState` returns `add`, `open`, `claimable`, or `claimed`. `useTodoClaimReward`
makes one automatic attempt, then retries only from the Retry action.

### SM-10: Photo cleanup

**Owner:** `src/features/photoCleanup/PhotoCleanupScreen.tsx`

**States:** `capture`, `checkingAccess`, `loading`, `ready`, `guide`, `complete`

| From | Event | Guard | To |
| --- | --- | --- | --- |
| `capture` | Photo chosen, access loading | | `checkingAccess` |
| `capture` or `checkingAccess` | Access denied | | `capture`, paywall opens |
| `capture` or `checkingAccess` | Access allowed, consent given | Photo readable | `loading` |
| `capture` or `checkingAccess` | Photo cannot be read | | `capture`, with a message |
| Any preparation | Consent declined | | `capture` |
| `loading` | Plan returned | | `ready` |
| `loading` | Failure | | `capture`, with a message or the paywall |
| `ready` | Start | Plan has items | `guide` |
| `guide` | Last item finished, or end | | `complete` |

**Entry states:** A room plan starts at `ready`, and a routine run starts at `guide`.

**Invariant:** Every failure returns to `capture`, so no stage waits without an owner.

### SM-11: Voice note

**Owner:** `src/features/azoAssist/useVoiceNote.ts`

**States:** `idle`, `recording`, `transcribing`

| From | Event | To |
| --- | --- | --- |
| `idle` | Toggle, permission granted, session still current | `recording` |
| `idle` | Toggle, permission denied | `idle`, with an alert |
| `recording` | Toggle, or 60 s reached | `transcribing` |
| `recording` or `transcribing` | `end` event | `idle`, text delivered or an error set |
| any | `cancel` or unmount | `idle`, nothing delivered |

**Invariant:** Leaving the screen never submits speech. Refer to the open finding on late `end` events.

### SM-12: AI data consent

**Owner:** `src/features/aiConsent/ensureAiDataConsent.ts`

**States:** Unknown, asking, allowed, declined

**Invariants**

- Every AI call waits for this result.
- An unreadable preference asks again and never shares data.
- A second request settles the first as declined, so one question is pending at a time.

| From | Event | To |
| --- | --- | --- |
| Unknown | Saved yes | Allowed |
| Unknown | No saved yes | Asking |
| Asking | Accept | Allowed, saved, waits for the sheet to close |
| Asking | Decline, swipe, or a newer request | Declined |

### SM-13: Guided breathing session

**Owner:** `src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx`

**States:** `idle`, `intro`, `placement`, the breathing phases (inhale, hold, exhale), `done`

**Invariants**

- `savedSessionRef` allows one save per session.
- Losing focus returns to `idle`, except from `done`.

| From | Event | To |
| --- | --- | --- |
| `idle` | Start | `intro`, then `placement` or the breathing phases |
| Breathing phases | Rounds complete | `done`, session saved |
| not `done` | Screen loses focus or closes | `idle` |

## Other machines

These are listed so a future audit can find them. They were not checked for invalid states.

| Machine | Owner | States |
| --- | --- | --- |
| Heart rate capture and save | `components/heartRate/HeartRateCaptureFlow.tsx`, `lib/heartRate/types.ts` | Setup, capture, result, and save retry |
| Routine player | `screens/RoutinePlayerScreen.tsx` | `RoutinePlayerState`, paused, rearranging |
| Daily reward stage | `features/room/useDailyRewardStage.ts` | Decorating, handing over, sealing |
| Home card paywall | `stores/homeCardPaywallStoreCore.ts` | Unhydrated, hydrated, requested, cleared |
| Exit offer | `stores/exitOfferStore.ts`, `RootNavigator` | Pending, presented |
| Mood check-in and lessons | `screens/MoodCheckInScreen.tsx`, `screens/LessonScreen.tsx` | Screen-owned steps |
| Notification permission | `services/notifications/types.ts` | `granted`, `denied`, `undetermined` |
| ATT consent | `services/attribution/attPrompt.ts` | `authorized`, `denied`, `restricted`, `notDetermined` |
| Paywall step transition | `components/onboarding/screens/OnboardingPaywallScreen.tsx` | `idle`, `exiting`, `entering` |
| Animation only | `useSettlingGoals`, `useAzoMessageEntrance`, `PlanBenefitsScreen`, `ProfileReport` | Visual phases |
| Breath hold phases | `features/exercise/dailyBreathHold/domain/` | Domain types only. No screen in this folder owns them. |
