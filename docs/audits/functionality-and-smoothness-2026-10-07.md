# Functionality and UI smoothness audit — 2026-10-07

Reviewed checkout: `c0757e45`. Production code was left unchanged.

## Scope and evidence

This is a risk-based review across the repository: bootstrap/auth/navigation/onboarding, guided breathing and attention sessions, camera/heart-rate processing, audio/haptics, Home/Routine/Plan/history/rooms, shared UI, queries/services, notifications, subscription integration, and Supabase migrations/edge functions. The source tree contains 940 implementation files and approximately 144,512 lines, plus 250 test files. This is not a claim that every line or every runtime interaction was exhaustively verified.

`npm run check` passed TypeScript and all **2,091 tests**. `npm run ios:release:validate` passed. A production iOS Metro/Hermes export also succeeded (`npx expo export --platform ios --output-dir /private/tmp/azora-audit-ios-export`); this verifies bundling, not a native Xcode build or runtime. Local targeted reproductions verified transient-error auth behavior, stale identity work, failed mood reward projection, moving trial reminder deadlines, and paused-duration calculation. A synthetic heart-rate benchmark verified synchronous JavaScript blocking. Existing tests passing does not cover these integration failures; 89 test files read source text, and the suite does not substitute for native interaction tests.

No live backend, purchases, account mutations, or notifications were exercised. No simulator was booted. Physical-device FPS, memory, camera behavior, VoiceOver, and 5–10 release session cycles remain unverified. Database findings describe checked-in migrations, not an independently inspected deployed schema. Priorities: **P1** = fix promptly because a core flow can lock or identity/paid state can become incorrect; **P2** = actionable correctness/performance issue; **P3** = follow-up or profiling target.

## Highest-priority findings

### F01 · P1 · Network failures can destroy a valid login or strand bootstrap

Evidence: `src/stores/authStore.ts:54–67`, `src/services/supabase/sessionValidatorCore.ts:8–14`, `src/hooks/useAppGate.ts:55–60`, `src/hooks/appGateCore.ts:66–67`.

Bootstrap interprets every `getUser` error, and a five-second validation timeout, as invalid authentication and calls sign-out. Separately, any onboarding/profile query error triggers sign-out, including a background refetch with previously valid cached onboarding data. Local reproduction confirmed a network error returns `false` and a query error with cached `data: true` maps to `signed_out`. If bootstrap's awaited sign-out rejects, initialization never reaches session publication or auth subscription registration; `authInitialized` already prevents another attempt.

Reproduce with a valid stored session and slow/unavailable auth/profile networking. Preserve the session for transient errors, distinguish explicit invalid/revoked credentials, and provide retry/error state without removing authenticated state. Always finish bootstrap subscription setup through a controlled error path.

### F02 · P1 · Failed saves can announce unearned rewards and open an undismissable modal

Evidence: `src/screens/MoodCheckInScreen.tsx:176–203`, `src/screens/LessonScreen.tsx:180–215`, `src/screens/AttentionSessionScreen.tsx:184–207`, `src/features/room/useDailyCompleteSnapshot.ts:54–60`, `src/features/room/DailyRewardFlow.tsx:234,500,533`, `src/features/room/DailyRewardSurface.tsx:50`.

Mood retains its final-unit handoff after save failure even though it suppresses coins. Lesson and attention navigate into rewards immediately, independently of the write's successful outcome; withdrawing first-win state does not revoke coins or the day-complete handoff. Home projects the failed unit as complete. The decoration picker then uses live canonical `canClaim=false`, disables every tile and its button, and offers no close control. Android Back is explicitly ignored.

Reproduce by failing the final mood save, choosing No thanks, then choosing a decoration. A local execution of the actual mood leave function and snapshot rules produced projected completion/unlocked state while canonical reward readiness stayed false. Lesson/attention failures share the handoff hazard. Tie reward authorization to the actual completion outcome, revoke failed projections, support retry, and always provide a recovery/dismissal path in the picker. Immediate visual feedback can remain optimistic.

### F03 · P1 · Back during contract sealing can permanently stall onboarding

Evidence: `src/components/onboarding/OnboardingFlow.tsx:1066–1106,1142–1144,2791–2794`, `src/components/onboarding/screens/PactScreen.tsx:74–77,119`, `src/components/onboarding/OnboardingScreenLayout.tsx:276–292`.

The save awaits both database work and a promise resolved only by the Pact celebration callback. Back remains available while submitting. Leaving Pact unmounts its celebration/timer, so the callback never resolves; even successful database writes cannot finish `Promise.all`. The persistent flow keeps `isSubmitting` and `sealInFlightRef` set, preventing retry. The celebration overlay also uses `pointerEvents="none"`.

Reproduce by sealing, then tapping Back before the celebration completes. Disable leaving during the committed save or explicitly resolve/cancel the visual wait on departure. A visual callback must not be the sole owner of a persistence workflow's completion.

### F04 · P1 · Delayed auth work can restore the previous account's identity

Evidence: `src/services/supabase/authIdentitySyncCore.ts:140–174,197`, `src/services/subscriptions/revenueCatIdentitySync.ts:44–45`.

Auth events launch independent async work. After profile creation, an old handler does not check disposal or whether sign-out/account switching superseded it before identifying the user and syncing RevenueCat. A reproduction with the production core, delayed user A profile, then sign-out produced: `signed out → clear RevenueCat → identify A → sync RevenueCat A`. A delayed A handler can similarly run after B. Serialization inside RevenueCat does not repair the ordering before its queue.

Use an auth generation/current-user check after awaits and before identity/store changes; invalidate it on sign-out and disposal. Apply the same rule to explicit identity refresh. The demonstrated defect is incorrect analytics/billing SDK identity; a guaranteed wrong-account charge was not demonstrated, and purchase UI has additional readiness checks.

### F05 · P1 · Old webhook events can overwrite newer paid state

Evidence: `supabase/functions/revenuecat-webhook/index.ts:233,251–255,295–297`; related web path: `supabase/functions/revenuecat-web-checkout-webhook/index.ts:625`.

The native webhook accepts a duplicate audit insertion and continues, then unconditionally upserts subscription state without comparing the event timestamp. A delayed expiration or replayed old purchase can overwrite a newer renewal. Server-gated photo cleanup reads this mirror and can deny a paying user despite the client SDK knowing they have Pro. The web webhook checks ordering, but its separate read/write is still vulnerable to concurrent delivery.

Perform event ordering and state application atomically in the database, retaining audit logs and retry safety. Test newer renewal followed by old expiration, duplicate delivery, and simultaneous out-of-order delivery. Simply returning on duplicate logging is insufficient if an earlier delivery logged successfully but failed its subscription write.

## Functional correctness and recovery

### F06 · P2 · Onboarding recovery can skip unfinished plan setup

Evidence: `src/components/onboarding/OnboardingFlow.tsx:472–473,1073–1100,1148–1159`, `src/hooks/useAppGate.ts:43–69`, `src/services/profile/onboardingProfileRecovery.ts`, `src/services/dailyPlan/dailyPlanScheduleService.ts`, `src/services/dailyPlan/dailyPlanExercisesService.ts`.

The profile is saved before schedule/exercise/enrollment writes finish. Restart after that point resumes at the paywall; a Pro user can auto-complete onboarding. Neither completion path repairs missing setup. Missing schedule reads default values and missing exercises remain missing; saved profile data lacks the exact customized choices needed to reconstruct them. Persist a recoverable setup checkpoint/payload or commit required setup atomically, and verify it before declaring recovery complete. Enrollment failures are also swallowed in the active setup path.

### F07 · P2 · A saved breathing session can lose plan credit and coins

Evidence: `src/queries/tracking/useCompleteBreathingSessionMutation.ts:109–130`.

Session completion and plan advancement are separate requests. If the session saves but advancement fails, its exception is swallowed and the mutation reports success. History/quota reflect completion while plan progress and its reward remain missing. Refetching cannot create the missing write. Combine writes in one completion RPC or retain an idempotent retry tied to the saved session ID. Verify a connection drop specifically between the two writes.

### F08 · P2 · Concurrent room writes can duplicate floors and daily claims

Evidence: `src/services/room/roomService.ts:282,300,338–340`, `supabase/migrations/20260807000100_create_room_hotel.sql:22,40`, `supabase/migrations/20260807000200_room_daily_earn.sql:14`.

Fresh reads followed by inserts are not atomic. Two devices can both see no room, create distinct floor-1 rooms, and each place the day's piece. Concurrent next-room creation can duplicate later floors. `(room_id, slot)` uniqueness does not protect `(user_id, floor)` or a reward date across rooms. Add the appropriate uniqueness constraints and a transactional create/claim operation; handle collisions by returning canonical state. Test parallel first claims and parallel next-floor creation against a local database.

### F09 · P2 · Pausing changes the breathing phase's actual duration

Evidence: `src/features/exercise/guidedBreathing/hooks/useBreathingPhaseRunner.ts:144–155,197–224`.

Remaining time is stored in whole-second ticks. Pause clears the timer without accounting for the fraction since the last tick; resume animates the full stored remainder. Pause 0.9 seconds into a four-second inhale, then resume: it runs another four seconds. Repeated pauses accumulate delay; late JS ticks also lengthen hold phases. Track precise active milliseconds with a monotonic clock and derive the displayed seconds from that clock.

### F10 · P2 · Exercise duration includes all paused time

Evidence: `src/features/exercise/guidedBreathing/domain/breathingSessionTiming.ts:30–37`, `GuidedBreathingSessionScreen.tsx:283–318,407`.

The duration helper uses end minus start whenever a start timestamp exists, ignoring active elapsed time. Local reproduction: 60 active seconds plus 300 paused seconds reports 360 seconds. This inflates results and aggregate exercise minutes while BPM sampling excludes the pause. Store active duration separately from real start/end timestamps, using the precise clock from F09.

### F11 · P2 · One attention session can count twice

Evidence: `src/screens/AttentionSessionScreen.tsx:155–178,279–284`, `src/components/common/ChunkyButton.tsx:117–121`, `src/queries/program/useCompleteAttentionSessionMutation.ts:103–107`, `supabase/migrations/20261002000200_attention_resets_count_like_breathing.sql:202–204`.

`finished.current` is set but never checked before completion side effects; Done remains enabled during departure. Two queued presses can submit twice. A refused second plan completion falls back to a standalone session, whose RPC increments the counter again, consuming additional free usage. Add a synchronous completion guard, disable Done, and give completion a stable idempotency key.

### F12 · P2 · Premium duration can start before access resolves

Evidence: `src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx:133–140,397–420,608–613`, `src/features/exercise/shared/domain/breathingSessionStart.ts:25–29`.

Loading LongSessions entitlement is treated as unlocked. With the saved heart-rate preference off, the start resolver permits the session before the remaining access-loading checks. A long session can begin and is not rechecked when the lead-in finishes. Disable the paid action while its entitlement is unresolved and recheck at the actual session start. Test delayed entitlement with HR off and a premium duration selected.

### F13 · P2 · Photo preparation errors bypass recovery

Evidence: `src/features/photoCleanup/PhotoCleanupScreen.tsx:144–156,172,175–185`.

Image manipulation and missing-base64 errors occur outside `generatePlan`'s catch. Both callers discard the promise. In the checking-access branch, the selected asset is cleared but the stage stays `checkingAccess`; preparation failure can leave an endless spinner with no retry explanation. Catch the entire prepare/generate operation and restore a usable stage. Guard concurrent selections and late navigation: a delayed access-denial response currently can present a paywall after the screen has been closed.

### F14 · P2 · History omits legitimate completed activities

Evidence: `src/services/history/dayHistoryService.ts:59–65`, `src/screens/HistoryScreen.tsx:150–172,261–273`, `supabase/migrations/20261002000200_attention_resets_count_like_breathing.sql`.

Attention Resets are recorded in activity counts/program completions but never loaded into day history. Breath holds are loaded but not rendered or counted in the empty-day rule. A Reset-only or legacy breath-hold-only date can say “No activities.” Today renders assigned units instead of all saved breathing sessions, so an extra Explore/repeated exercise is hidden until the past-day branch applies. Include canonical recorded activities alongside planned units and deduplicate by session identity. Unknown technique IDs are also filtered from past rows; no currently retired supported ID was found, so that part is a compatibility risk rather than a demonstrated current record loss.

### F15 · P2 · Trial reminders can repeat or be continually postponed

Evidence: `src/services/notifications/notificationSchedulerCore.ts:188–214`, `src/services/notifications/notificationScheduler.ts:73`, `src/services/notifications/notificationScheduleRecords.ts`.

Once the original reminder time passes, reconciliation computes another `now + five minutes` deadline for the same trial. Foreground reconciliation can replace a pending reminder with a later one or schedule another after delivery. Local successive calculations produced 15:05 and 16:05 for one trial. Persist one catch-up deadline and delivery/scheduling identity scoped to that trial; verify multiple foregrounds before and after delivery. Actual OS delivery was not tested.

### F16 · P2 · Failed room operations provide no useful recovery feedback

Evidence: `src/screens/NextRoomScreen.tsx:48–70`; related `src/screens/HotelScreen.tsx:86–109`.

NextRoom only renders pending state and handles success. A failed write silently returns the same Start button. Hotel read errors produce an empty canvas without an error message/retry. Apply the existing room save error/retry pattern and distinguish an empty result from a failed read. Test offline entry and a dropped next-room response.

### F17 · P2 · A font-loading error leaves startup behind the splash indefinitely

Evidence: `App.tsx:63–87,89–93`; installed `node_modules/expo-font/src/FontHooks.ts:20–42`.

`useFonts` returns an error separately and leaves `loaded=false` on failure. App discards that error and only hides the prevented native splash when `fontsLoaded` becomes true. A failed font load therefore has no fallback or visible retry. Handle the error explicitly and make startup reach a usable/error state. This conditional failure is proven by the code; no naturally occurring bundled-font failure was observed.

## UI cost, scalability, and accessibility

### F18 · P2 · Routine mounts an unrestricted number of animated tasks

Evidence: `src/screens/PlanScreen.tsx:126`, `src/features/selfCare/TodoListSection.tsx:1243–1261`, `src/features/selfCare/CompletedGoalsDrawer.tsx:254`, `src/services/selfCare/selfCareService.test.mjs:185`.

The service permits routines beyond the former capacity, but a ScrollView maps every task into an animated draggable row. Opening completed tasks eagerly mounts that collection too. Native view, gesture, and animation setup grows with the whole list, including off-screen items. Virtualize/paginate both collections while keeping drag ownership narrow. Benchmark 100–500 tasks, rapid completion, drawer open, and tab return. The unbounded workload is confirmed; a specific FPS regression was not measured.

### F19 · P2 · Full heart-rate analysis blocks JavaScript for roughly half a second

Evidence: `src/hooks/useHeartRateCapture.ts:190–196`, `src/lib/heartRate/captureResult.ts:489`.

Deferring until after a paint does not move `buildCaptureResult` off JavaScript. A local synthetic 90-second capture with 5,400 frames and seven native ROI IDs took **571 / 505 / 468 ms** in three consecutive calls (an earlier run measured 510 / 477 / 435 ms). Native animation may continue, but JS touch handling and renders cannot run during that computation. Move CPU work to an appropriate background/native/worklet execution context or split bounded stages. Preserve result correctness and compare against recorded captures.

The temporary reproduction is `/private/tmp/azora-heart-rate-audit-benchmark.mjs`, run from the repo with:

```sh
node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --loader ./scripts/resolve-extensionless-ts.mjs /private/tmp/azora-heart-rate-audit-benchmark.mjs
```

The fixture is a covered synthetic 72-BPM waveform, not a physical-device recording or measured device FPS.

### F20 · P2 · Growing database reads can silently truncate data

Evidence: `src/services/selfCare/selfCareService.ts:96–104,145–150`, `src/services/room/roomService.ts:183–204`; repository cap discussion in `src/services/wallet/walletService.ts:26–28`.

Queries treat one API page as the complete set. Normal date-specific goal reads include archived goals and filter after fetching, so old active goals can disappear once newer/archived rows fill the server page. Hotel likewise reads all rooms/decorations without pagination; sufficiently old floors become incomplete. Historical one-off completion reads have the same missing-page risk. Use database-side eligibility filtering and explicit pagination. The common 1,000-row cap is documented locally; the live project's configured cap was not queried. This is a long-term growth defect, not evidence that current users have already crossed it.

### F21 · P2 · Mandatory signature has no accessible activation alternative

Evidence: `src/components/onboarding/SignaturePad.tsx:30–49,75`, `src/components/onboarding/screens/PactScreen.tsx:69,138–146`.

The seal only appears after a drawn pan stroke. The signature area supplies a label but no accessible action or equivalent confirmation control. A user who cannot draw has no standard accessible way to satisfy this mandatory step. Provide an accessible acceptance/name-based action through the same confirmation flow. The missing alternative is a code finding; verify actual VoiceOver and Switch Control behavior on device.

### F22 · P2 · Time wheel declares adjustability without implementing it

Evidence: `src/components/common/InlineTimePicker.tsx:60–85`.

The entire picker is an accessible `adjustable` element with a value, but no increment/decrement actions or action handler. Wheel children are plain text. Implement meaningful adjustable fields or an accessible alternate input and test VoiceOver/TalkBack changes.

## Backend integrity and Android prerequisites

**B01 · P2 · Client can mint arbitrary coins.** `supabase/migrations/20260907000100_create_wallet.sql:25–31` grants direct authenticated inserts with only owner-ID verification. No later migration revokes it; any positive delta/reason contributes to the canonical balance. Restrict writes to validated server operations/triggers. `src/services/wallet/walletService.ts:59` also performs a balance check separately from spend insertion, allowing concurrent overdrafts. Grant/spend hooks have no current production callers and the shop is future work; this is an existing backend integrity defect and a prerequisite before relying on coins for purchases, not a demonstrated shop exploit.

**B02 · P2 · Photo cleanup free usage is not atomic.** `supabase/functions/photo-cleanup-plan/index.ts:118–128,222–230` checks availability before generation and only records it afterward. Parallel requests can both generate and return plans; a failed record still returns success. Atomic hourly/day quotas limit exposure but do not enforce the lifetime free use. Reserve/finalize a use atomically, with release on unusable generation, and test concurrent requests.

**A01 · Android blocker · Missing heart-rate implementation.** `plugins/with-heart-rate-plugin.js:85–109` registers iOS/Xcode only; no Android frame processor exists. `src/lib/heartRate/heartRatePlugin.ts:4–8` silently returns null when unavailable. Heart-rate capture and guided placement can wait indefinitely for samples on Android. Implement the Android adapter or expose capability and provide a supported non-camera path before entering the flow. Android readiness was reviewed statically; no Android build/device was used.

## Lifecycle decisions and profiling work

**Foreground policy needs a product decision.** `src/features/exercise/shared/hooks/useCancellableFlow.ts:29–39` owns navigation blur/unmount but not app backgrounding. Guided timers/lead-in, attention countdown (`AttentionSessionScreen.tsx:141–146`), and heart capture wall clocks can continue or expire while the app is away; audio already stops in background. Choose pause/resume, intentional continued execution with supported audio, or cancellation and apply one coherent ownership policy. Missing AppState coordination is confirmed; exact suspend/resume behavior and the intended user experience remain open. The audit asked the user this question.

**P3 · Recurring visuals still lack complete visibility ownership.** `src/features/attention/AttentionSqueezeShape.tsx:50–71`, `src/features/room/RoomGhostSlots.tsx:57`, and `src/features/room/RoomReplay.tsx:147` own loops through ordinary effects rather than the existing foreground/focus helper. They can remain active behind covered content or while backgrounded. Apply `useWhileVisible` to recurring work while preserving one-time sequencing, then profile. No quantified accumulated GPU/frame cost was measured. Tilt hooks have similar weaknesses, but their only consumer is currently unused, so they are not treated as a live performance defect.

Further release measurements: cold startup's seven background predecodes plus the 2.2-second welcome hold; large hotel picture recording/snapshotting; sheet drags using JS PanResponder while heart analysis or query work runs; and entrances after visiting all tabs. These are profiling targets, not confirmed measured jank.

## Suggested remediation order and verification

1. Fix F01–F05: preserve valid auth, connect completion outcomes to rewards, make decoration recovery possible, remove the onboarding visual-wait deadlock, and enforce identity/webhook ordering. Add behavioral tests for delayed/failing operations and superseded identities.
2. Repair setup/completion transactions and repeated submissions (F06–F08, F11). Test interrupted writes, session retries, and two-client room races against a local database.
3. Use a precise active clock and coherent background policy (F09–F10), recheck paid actions (F12), and handle photo/startup errors (F13/F17). Exercise permission denial, image preparation failure, and lock/unlock at every phase.
4. Correct history/reminder behavior and error/accessibility paths (F14–F16, F21–F22), then virtualize growing collections and move heavy analysis off JS (F18–F20).
5. Smoke-test 5–10 complete cycles on a release build: Home → exercise → completion → reward → Home, each Reset, repeated mood/lesson completion, room transitions, all tabs, app background/foreground, and Back. Record bounded route depth, FPS/JS stalls, memory, and teardown of camera/torch/sensors/audio/haptics/timers. Include small phones, an older supported iPhone, and iPad; perform Android tests once A01 has a supported path.

Documentation drift to resolve alongside relevant changes: `docs/architecture/exercise-sessions.md` still describes removed DailyBreathHoldScreen/phase hook; `docs/architecture/main-tabs.md` says Profile is not a separate route while MainTabs registers it. Confirm intended product behavior before changing routes or restoring removed features.

## Summary of learnings

The strongest remaining failures occur at async boundaries: optimistic celebration outlives failed persistence, identity work outlives its account, and independent writes are treated as one successful operation. Existing return-to-Home, visibility, native audio, and cache reconciliation patterns are useful foundations. Fix those ownership/transaction boundaries first, then address measured synchronous analysis and unbounded list/read growth; extra memoization will not resolve them.
