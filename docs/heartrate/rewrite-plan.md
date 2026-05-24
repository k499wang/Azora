# BPM / HRV Architecture Rewrite Plan

## Status

This is an architecture plan, not an implementation log. It replaces the earlier
"delete the offline pipeline and make live/final share one detector" proposal
with a safer boundary rewrite.

Chosen strategy: **boundary rewrite**.

Keep the useful signal-processing work that already exists, especially the final
batch analyzer. Rewrite the contracts around it so final BPM, final HRV, graphs,
persistence, and result UI consume one explicit final-analysis object.

## Current Architecture Assessment

The current architecture is directionally right but too fragmented.

Good parts:

- Native camera work is already behind a narrow bridge that emits compact
  `PpgFrameSample` values.
- Live detection is separated from final analysis, which is correct for PPG.
  Live UI needs low latency; final BPM/HRV needs offline robustness.
- Final HRV now comes from the batch-selected beat series in `analyzeCapture`,
  not from live `HeartRateManager` IBIs. That is the correct direction.
- HRV math in `src/lib/hrv.ts` is mostly pure and testable.

Problems:

- There are too many "BPM-like" outputs: live BPM, final BPM, graph BPM,
  persisted BPM samples, min/max BPM, and breath-hold BPM summaries.
- Result graphs and persistence use separate smoothing/sample policies.
- UI still recomputes HRV fallback values in some places.
- HRV availability is binary, but the product decision is to show HRV with
  confidence when signal is marginal.
- `captureResult.ts` owns too much final-gating logic and debug logging.
- `useHeartRateCapture`, `useHeartRateStream`, and `useLivePulse` duplicate
  validation and live frame-pump behavior.
- `docs/heartrate/architecture.md` is stale in places and still describes older
  signatures like `buildCaptureResult(samples, ibiSamples)`.

## Critique Of The Previous Rewrite Plan

The previous rewrite plan identified real pain but overcorrected.

Keep from that plan:

- Centralize result graph generation.
- Remove domain math from UI.
- Reduce duplicated live hook logic.
- Remove leftover HRV debug logging.
- Add diagnostics around chosen ROI/channel, SNR, retention, and rejected
  intervals.
- Treat graph BPM as presentation, not raw physiology.
- Test whether ROI/channel switching is a major RMSSD variance source by adding
  an experimental preferred-candidate path. Allow each capture to re-pick; do
  not globally lock a user/device to one candidate.

Do not keep from that plan:

- Do **not** delete `signalProcessing.ts` as the first move. The batch analyzer is
  currently the best final HRV path. Removing it would replace a stronger offline
  analyzer with the live detector's constraints.
- Do **not** force live BPM and final BPM to agree "by construction". It is okay
  for live and final to differ slightly because they solve different problems.
  The product requirement is trust and explainability, not identical algorithms.
- Do **not** remove HRV artifact preprocessing entirely. One artifact pass may be
  enough eventually, but that needs real capture comparison. For now, make
  cleanup explicit and measured instead of deleting safeguards.
- Do **not** collapse all three hooks early. Hook consolidation has high UI
  surface area and should happen after the final-analysis boundary is stable.
- Do **not** claim 5-8 ms run-to-run HRV variance without ground truth. With
  45-second camera PPG, the realistic goal is better internal consistency and
  clearer confidence, not medical-grade repeatability.

## Target Architecture

Create one final-analysis boundary:

```ts
type HrvConfidence = 'good' | 'fair' | 'low' | 'unavailable';

interface FinalPpgAnalysis {
  reading: {
    finalBpm: number;
    confidence: number;
    quality: PpgQuality;
    recordedAt: string;
    durationMs: number;
    rmssd: number | null;
    sdnn: number | null;
    detrendedSdnn: number | null;
    pnn50: number | null;
    stress: number | null;
    hrDrop: number | null;
    beatCount: number | null;
    hrvConfidence: HrvConfidence;
    hrvAvailabilityReason?: HrvAvailabilityReason;
  } | null;
  cleanIbiSamples: IbiSample[];
  presentationBpmSeries: Array<{
    offsetMs: number;
    bpm: number;
    signalQuality: number | null;
  }>;
  rrSeries: Array<{
    offsetMs: number;
    ibiMs: number;
    signalQuality: number | null;
  }>;
  diagnostics: {
    roiId: string | null;
    channel: PpgChannel | null;
    snrDb: number | null;
    frequencyBpm: number | null;
    peakBpm: number | null;
    rawIntervalCount: number;
    rejectedIntervalCount: number;
    retentionRatio: number | null;
    artifactRatio: number | null;
    rawSdnn: number | null;
  };
  error: CaptureResult['error'];
}
```

This boundary becomes the only place that decides:

- whether a final BPM is available
- whether HRV is good/fair/low/unavailable
- which clean intervals feed HRV stats
- which BPM series feeds graphs and persistence
- which diagnostics explain the result

Canonical final beat-series rule:

- Final analysis must produce one clean IBI series for the session.
- Final BPM, RMSSD, SDNN, detrended SDNN, pNN50, stress, result graph data,
  persisted IBI samples, and persisted BPM samples must all be derived from
  that same clean IBI series.
- UI and persistence layers may cache or display derived values, but they must
  not independently rebuild competing final BPM/HRV values from raw samples.
- If two stored/derived representations disagree, the clean IBI series wins.

Live BPM remains separate:

- `HeartRateManager` continues to feed live pulse ticks and live BPM.
- Live values are presentation-only.
- Final BPM/HRV do not depend on live IBIs.
- Live BPM is optimized for responsiveness and user feedback. Final analysis is
  optimized for whole-capture accuracy, artifact rejection, and explainability.
- Live and final values should be allowed to differ slightly. The architecture
  requirement is that each value has a clear owner and purpose, not that live
  and final BPM match by construction.

## Implementation Phases

### Phase 0a - Make Live Filtering Sample-Rate-Aware

Fix the live detector's sample-rate assumption before relying on live BPM
behavior for product decisions.

Problem:

- `HeartRateManager` currently designs its high-pass and low-pass biquad
  coefficients for a fixed 30 Hz input.
- At least one live stream path has used a 20 FPS frame-processor throttle.
- If a detector receives 20 FPS data but runs 30 Hz filter coefficients, the
  effective band changes. A nominal `0.7-3.5 Hz` band behaves closer to
  `0.47-2.33 Hz`, which can distort pulse shape and peak timing.

Required change:

- Track real frame cadence from frame timestamps using a rolling median frame
  delta.
- Construct or update `HeartRateManager` with the measured effective sample
  rate instead of assuming 30 Hz.
- Design high-pass and low-pass biquad coefficients from that measured sample
  rate.
- Rebuild coefficients only when the measured rate changes meaningfully, so
  normal timestamp jitter does not constantly reset detector state.
- Prefer 30 FPS processing for measurement paths, but still make the detector
  correct when a device or code path runs below 30 FPS.

This phase is about correctness, not smoothing. It does not make live BPM the
source of final HRV. It prevents live filtering from being mathematically wrong
when the actual frame cadence differs from the camera target.

### Phase 1 - Final Analysis Boundary

Add a new final-analysis module around the existing batch analyzer.

Recommended home:

- `src/lib/heartRate/finalAnalysis.ts`

Responsibilities:

- call `analyzeCapture(samples)`
- derive HRV stats from the selected beat series
- produce clean IBI samples
- assign `hrvConfidence`
- build graph-ready BPM/RR series
- expose diagnostics
- optionally prefer a candidate selected from an early quality scan. This is
  not a hard lock by default. The analyzer should use the preferred candidate
  only if it passes the same quality gates as the normal winner; otherwise it
  falls back to full multi-candidate scoring.
- preserve real frame timestamps throughout final analysis. Do not assume fixed
  30 FPS timing when frame timestamps are available.
- improve final peak timing precision where practical by estimating the local
  peak location around detected maxima instead of treating the nearest camera
  frame as the exact beat time. This should be treated as a conservative
  refinement heuristic, not proof that the app has recovered sub-frame
  physiological timing. HRV is highly sensitive to small timing errors, so this
  must be covered by synthetic tests and capture-data ablation.
- compute detrended SDNN from the clean IBI series for short phone-camera
  readings. Use a simple linear detrend first; do not introduce polynomial
  detrending unless diagnostics show linear detrending is insufficient.
- keep raw/standard SDNN in diagnostics as `rawSdnn` so the app does not lose
  the conventional "standard deviation of NN intervals" value. The app-facing
  short-reading SDNN may use `detrendedSdnn`, but the distinction must stay
  explicit in names, docs, and tests.
- prefer larger central ROI candidates for final HRV beat detection. Initial
  preference order: `full`, `center`, then `inner`. Edge ROIs (`left`, `right`,
  `top`, `bottom`) may still be scored for diagnostics and fallback, but should
  need a clear quality/SNR margin before they become the final HRV beat-series
  source.

`buildCaptureResult(samples)` should become a thin compatibility adapter over
this new module.

Keep `signalProcessing.ts` and `cubicSpline.ts` in this phase, but do not treat
the 180 Hz cubic-spline upsample as the reason the offline path is robust.
Cubic-spline upsampling cannot recover information past the native camera
sampling limit. The offline path's real strengths are whole-capture analysis,
ROI/channel scoring, frequency BPM estimation, expected-BPM-aware refractory,
peak/frequency agreement, stabilization trimming, and artifact filtering.

Implementation note:

The experiment is implemented as a new `ComputeBpmOptions` field
`preferredRoiChannel?: { roiId: string; channel: PpgChannel }`. `analyzeCapture`
should analyze that candidate first and use it only when it meets the normal
quality gates. It must still keep the full multi-candidate fallback. No
deletions in `signalProcessing.ts`.

ROI note:

The native plugin currently exposes `full`, `center`, `inner`, `left`, `right`,
`top`, and `bottom` ROIs on iOS. The rewrite should not blindly delete edge ROI
sampling, because those candidates are useful for diagnostics and fallback. The
final HRV selector should, however, bias toward the larger central ROIs unless
an edge ROI is measurably better.

### Phase 1.5 - Instrumentation, Measurement, And Decision Point

Before adding the HRV confidence policy, capture quantitative evidence about
where RMSSD variance comes from.

Steps:

- Add a development-only diagnostics export or logging switch for final
  analysis. It should not produce unconditional production logs.
- Record 10 back-to-back 45-second captures with the same user, hand
  position, and lighting.
- For each capture, log via the diagnostics object: chosen ROI, chosen
  channel, SNR, frequency BPM, peak BPM, raw interval count, rejected
  interval count, retention ratio, artifact ratio, final RMSSD, raw SDNN, and
  detrended SDNN.
- Compare runs with and without preferred ROI/channel enabled.

Decision:

- If RMSSD variance drops substantially and quality metrics stay equal or
  better with the preferred-candidate path, ship it as the default preference
  policy.
- If RMSSD variance is similar or quality metrics degrade, keep preferred
  candidate selection behind a development flag and make the Phase 2 confidence
  tier the user-facing answer.

This phase produces small diagnostic code plus a one-page measurement note. It
exists so Phase 2's design is informed by real data instead of theory.

The measurement note should also report frame-timing behavior:

- observed sample/frame rate range
- whether each measurement path is actually processing near the 30 FPS camera
  target
- timestamp jitter
- dropped/duplicated frame count if detectable
- whether peak timing interpolation changes BPM/HRV materially on the same
  capture data
- an ablation comparing native peak timing, local/parabolic peak refinement, and
  cubic-spline peak refinement on the same captures

This matters because 30 FPS camera sampling gives roughly 33 ms spacing between
frames. If beat timing is snapped to frame boundaries, HRV metrics can move
substantially even when average BPM looks stable.

Frame-rate decision:

- Target 30 FPS processing for standalone capture, live stream, onboarding
  baseline, and breath-hold measurement paths.
- Remove or raise any 20 FPS frame-processor throttle unless measurement shows
  30 FPS is not sustainable on target devices.
- If any path intentionally runs below 30 FPS, the live detector and any filters
  on that path must use the measured sample rate instead of hardcoded 30 Hz
  coefficients.
- Do not call the offline path "more accurate" merely because it upsamples to
  180 Hz. Any accuracy claim must come from measured agreement, better candidate
  scoring, better artifact handling, or better peak/frequency consistency.

### Phase 2 - HRV Confidence Policy

Replace binary HRV availability with a confidence policy.

Default policy:

- `good`: enough clean beats, good quality, SNR above the current good threshold,
  high retention, low artifact ratio
- `fair`: enough clean beats, usable HRV, but weaker confidence/SNR/retention
- `low`: HRV can be computed but should be shown with visible low-confidence
  treatment
- `unavailable`: not enough clean beats or signal is too poor to compute

The UI should show RMSSD/SDNN for `good`, `fair`, and `low`, but visually mark
`low`. It should only hide HRV values for `unavailable`.

Do not silently convert marginal HRV to zero.

SDNN policy:

- For short phone-camera readings, app-facing SDNN should use the linearly
  detrended clean IBI series so slow HR drift during the capture does not
  dominate the value.
- Raw/standard SDNN should remain available in diagnostics and internal
  comparison as `rawSdnn`.
- Breath-hold results should be especially careful with SDNN wording because
  intentional HR drift can dominate raw SDNN.

### Phase 3 - Centralized BPM/RR Series

Create one domain-owned graph/persistence builder.

Recommended home:

- keep in `src/lib/heartRate/bpmSmoothing.ts`, or move to
  `src/lib/heartRate/presentationSeries.ts` if the file becomes clearer

Required builders:

```ts
buildPresentationBpmSeriesFromIbis(
  ibiSamples: IbiSample[],
  policy: 'restingResult' | 'breathHoldResult',
): BpmPoint[]
buildRrSeriesFromIbis(ibiSamples: IbiSample[]): RrPoint[]
summarizeBpmFromIbis(ibiSamples: IbiSample[]): {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
}
```

Policy:

- result graphs use calm presentation BPM
- raw instantaneous BPM is not shown to normal users
- graph smoothing never feeds back into HRV stats
- min/max should come from accepted clean intervals, not from rejected artifacts
- min/max shown in normal result UI should come from the same presentation
  series used by the chart, or from a clearly named cleaned summary. Do not use
  raw `60000 / ibiMs` extremes for normal user-facing cards.
- resting standalone-HR graphs and breath-hold graphs use named policies. They
  may start with the same parameters, but the policy names preserve room for
  breath-hold graphs to allow faster real HR movement.

Algorithm:

- `buildPresentationBpmSeriesFromIbis`: convert IBI samples to instantaneous
  BPM, then apply a sliding-**mean** window. Mean, not median. Median quantizes
  to discrete neighbor IBI values, which is mechanically the source of the
  70 → 58 stair-step jumps reported on result screens.
- Initial policy values:
  - `restingResult`: radius = 3 IBIs each side, 7 IBIs total; maximum ±3 BPM
    per displayed step.
  - `breathHoldResult`: radius = 2 IBIs each side, 5 IBIs total; maximum ±5 BPM
    per displayed step so real breath-hold HR movement is not flattened.
- The clamp is presentation-only. If raw mean BPM moves more than the policy
  allows in one window, the displayed series ramps over multiple points instead
  of jumping.
- The clamp applies only to the displayed series. The persisted IBI samples
  and computed HRV stats are untouched.

User-facing graph rule:

- Isolated missed-beat, double-beat, or peak-timing artifacts must not appear as
  sudden scary graph drops/spikes.
- If the clean IBI series has a gap or low-confidence region, the chart should
  prefer a gap, low-confidence styling, or a gently clamped transition over a
  precise-looking false jump.
- Raw instantaneous BPM can remain available in diagnostics, but not as the
  default result-screen series.

Persistence policy:

Persist both clean IBI samples and derived BPM samples. The clean IBI series is
canonical measurement data. The BPM samples are a derived display/cache series
for chart reads, compatibility, and easier inspection.

This mostly formalizes what the app already does today for standalone
heart-rate saves: `sessionPayload.ts` maps `result.ibiSamples` to persisted IBI
samples, derives BPM samples from those IBIs, and saves both. The rewrite should
not introduce a new persistence model unless a later migration is explicitly
approved.

Why: saving BPM samples is practical and already supported. The important
architecture rule is ownership: if BPM samples and IBI-derived values ever
disagree, IBI-derived values win. HRV stats must always come from clean IBIs,
not from persisted BPM samples.

Cost: clean IBI samples are a few KB per session. Negligible.

Migration: existing sessions that already persist BPM samples remain as-is
(no historical rewrite). New sessions continue saving both IBIs and BPM
samples. Readers may use stored BPM samples for chart performance, but any
recalculation, validation, or future graph-policy change should prefer IBIs
when they are present.

Current-state note: fresh result screens already build BPM graph points from
IBIs, while saved session detail screens load persisted BPM samples. The rewrite
should make those paths use the same domain builder so fresh and saved views are
consistent.

Optional future cleanup: if the team later decides BPM samples are unnecessary,
remove that write path only after one production release proves IBI-derived
read paths work across session detail, home charts, and profile/history charts.
That cleanup is optional, not part of this rewrite's definition of done.

This phase directly addresses scary graph jumps like `70 -> 58`.

### Phase 4 - UI And Persistence Consumers

Update consumers to use the final-analysis output instead of rebuilding stats.

Targets:

- standalone heart-rate result screen
- breath-hold result screen
- heart-rate session detail screen
- home BPM/HRV charts
- heart-rate session payload
- breath-hold completion payload

Rules:

- UI displays supplied values and supplied series only.
- UI does not call `computeHRVStats` as a fallback.
- Persisted clean IBI samples are canonical. Persisted BPM samples remain
  allowed as derived display/cache data. If the two disagree, IBIs win.
- Breath-hold and standalone HR use the same final-analysis path.
- Measurement screens should give concise capture-quality guidance before and
  during readings: stay still, keep steady finger pressure, avoid talking, and
  wait after exercise before taking a resting HRV reading.
- Do not add long educational copy to result screens. Use small inline states
  or pre-measurement guidance only where it helps the user produce a better
  signal.
- Result screens should show confidence/quality state when applicable instead
  of presenting marginal HRV/BPM graphs as equally precise.

Protocol guidance to encode in UX/product behavior:

- Prefer a short warmup/stabilization period before analysis where possible.
- Discard the warmup from final HRV calculations.
- Encourage repeat readings under similar conditions if the user wants
  trend-level HRV.
- If quality is poor, ask for a retry instead of forcing a confident result.

### Phase 5 - Live Hook Cleanup

After the final-analysis boundary is stable, reduce duplication in live hooks.

Live detection policy:

- Live BPM is a real-time feedback signal, not the source of final HRV.
- Live BPM should be smoothed and confidence-gated enough to avoid alarming
  second-to-second drops from isolated bad intervals.
- Live pulse ticks can be responsive, but displayed live BPM should favor
  stability over showing every detected interval.
- Live detection should expose enough quality state for the UI to show
  "adjust finger" or "poor signal" instead of continuing with noisy values.
- All live/capture frame processors should target 30 FPS unless device testing
  proves this is not sustainable. The current rewrite direction is to remove
  the 20 FPS live-stream throttle or raise it to the same 30 FPS target used by
  the camera format.
- Live filters must not assume 30 Hz blindly. Either guarantee 30 FPS input for
  the detector or make filter coefficients derive from measured sample rate.

Scope (do all of these):

- Extract `isValidFrameSample` from the three hooks into
  `src/lib/heartRate/frameValidation.ts`. Three copies become one.
- Extract the shared frame-pump pattern (manager.processFrame + beat-tick +
  live-signal-graph throttle + BPM throttle + presentation filter) into a
  helper hook `useLiveBeatPump`. Each of the three caller hooks then
  becomes a thin wrapper around `useLiveBeatPump` plus its mode-specific
  state (capture timer, finger-lost timeout, stream summary).

Scope (do not):

- Do not collapse the three hooks into one. Each hook has different
  downstream state machines (camera_check timing, finger-lost timeout,
  stream summary) that are clearer as separate hooks.

Expected outcome: ~250-300 LOC removed across the three hooks. They remain
three hooks, but they share validation and frame-pump code.

Avoid a large hook merge until tests and product behavior around capture,
streaming, onboarding, and exercise screens are stable.

### Phase 6 - Documentation And Diagnostics

Update `docs/heartrate/architecture.md` after implementation.

Add a diagnostics section documenting:

- chosen ROI/channel
- ROI preference/fallback reason
- SNR
- frequency BPM
- peak BPM
- raw interval count
- rejected interval count
- retention ratio
- artifact ratio
- HRV confidence
- raw SDNN and detrended SDNN
- observed frame rate, timestamp jitter, and dropped/duplicated frame count

Keep diagnostics available in code, but avoid noisy unconditional `console.log`
statements in production paths.

## Acceptance Criteria

Architecture:

- There is one final-analysis object for final BPM, HRV, graph series,
  persistence, and diagnostics.
- Final BPM, HRV, result graph series, persisted IBIs, and persisted BPM
  samples derive from one clean final IBI series.
- Short-reading app-facing SDNN is linearly detrended, while raw/standard SDNN
  remains available in diagnostics.
- Final HRV candidate selection prefers larger central ROIs and only uses edge
  ROIs when they clearly beat the central candidates on quality.
- Live BPM remains separate and presentation-only.
- UI no longer recomputes HRV stats.
- Result graphs and detail/home charts use one domain builder for any
  IBI-derived BPM series. Persisted BPM samples remain allowed as cached chart
  data.
- Breath-hold and standalone HR results share the same final-analysis policy.
- Live filter coefficients are derived from measured frame cadence or an
  explicitly guaranteed processing rate, not a hidden fixed 30 Hz assumption.

Behavior:

- A marginal 45-second camera reading can show HRV with a low-confidence state.
- Unusable HRV is clearly unavailable, not shown as zero.
- BPM graphs do not expose isolated interval artifacts as scary user-facing
  drops.
- Final BPM and graph BPM are explainably related, even if not identical.
- Final analysis preserves real frame timestamps and has a tested policy for
  peak timing precision.
- Measurement paths target 30 FPS processing, or explicitly adapt detector
  filters to the measured sample rate when 30 FPS is unavailable.
- Offline peak refinement is treated as measured/diagnosed behavior. The plan
  does not claim 180 Hz spline upsampling recovers true sub-frame physiological
  timing.
- Live BPM is stable enough for user feedback and does not masquerade as final
  HRV-quality data.
- Measurement UX nudges users toward conditions that improve phone-camera PPG
  accuracy.

Maintainability:

- `captureResult.ts` becomes an adapter, not the owner of all final-analysis
  policy.
- Smoothing policies are named and centralized.
- Stale architecture docs are corrected.
- Debug logs are removed or gated.

## Test Plan

Add or update tests for:

- clean synthetic PPG capture returns final BPM, HRV stats, and `good`
  confidence
- marginal synthetic capture returns HRV with `fair` or `low` confidence
- poor/noisy capture returns HRV unavailable without zero-valued HRV stats
- missed beat and double beat do not create scary presentation BPM graph drops
- presentation BPM series derives consistently from clean IBIs
- final stats, graph series, and persisted sample payloads all derive from the
  same clean IBI series
- linearly detrended SDNN reduces slow-trend inflation while raw SDNN remains
  available for diagnostics
- peak timing interpolation/timestamp handling behaves correctly on synthetic
  captures with known beat locations
- measured sample-rate/frame-rate handling behaves correctly at 30 FPS and does
  not silently use 30 Hz filter coefficients on lower-rate streams
- live filter coefficient tests cover at least 20 FPS and 30 FPS inputs
- capture-data ablation compares native peak timing, local/parabolic peak
  refinement, and cubic-spline peak refinement
- central ROI preference chooses `full`/`center`/`inner` unless an edge ROI has
  a clear quality advantage
- live BPM smoothing rejects isolated bad intervals without blocking normal
  gradual HR changes
- persisted BPM samples are treated as derived display/cache data
- if persisted BPM samples disagree with IBI-derived BPM, IBI-derived BPM wins
- UI components do not recompute SDNN/RMSSD
- breath-hold and standalone HR use the same final-analysis path

Run:

```bash
npm test
npx tsc --noEmit
```

## Recommended Execution Order

1. Make the live detector sample-rate-aware, or prove all live measurement paths
   feed it a stable 30 FPS stream. Prefer the sample-rate-aware fix because
   device cadence can drift.
2. Add `FinalPpgAnalysis` boundary while preserving current output behavior as
   much as possible.
3. Add HRV confidence, detrended SDNN, ROI preference diagnostics, and
   frame-rate diagnostics.
4. Centralize BPM/RR graph and persistence series.
5. Update UI and persistence consumers.
6. Clean up duplicated hook/frame validation code and align measurement paths
   on the 30 FPS processing target or measured-sample-rate filters.
7. Update docs and remove stale debug logging.
8. Optional later cleanup: after one production release proves IBI-derived read
   paths work everywhere, decide whether to remove the BPM-sample write path.

Do not start by deleting the batch analyzer. Deletions should happen only after
the new boundary proves which old exports are truly unused.

Trade-off in this ordering:

The user-visible bug (BPM graph 70 → 58 jumps) is fixed in step 3, not
step 1. This is deliberate — fixing the graph builder before the
final-analysis boundary means doing it twice. If product pressure requires
a visible fix sooner, swap order: ship the new
`buildPresentationBpmSeriesFromIbis` (sliding mean + clamp) standalone in
step 1, wire it into the existing result screens, and add the boundary
contract afterward. The math in the new builder does not depend on the
boundary.

## Open Risks

- There is no ground-truth reference device. This rewrite can improve internal
  consistency and trust, but cannot prove medical accuracy.
- 45 seconds is short for HRV. RMSSD can be useful, but confidence display is
  important.
- Camera PPG is sensitive to pressure, motion, torch saturation, and device
  camera behavior.
- Over-smoothing graphs can hide real physiology. This is acceptable for normal
  result screens, but raw diagnostics should remain possible for debugging.
- Detrended SDNN is useful for short phone-camera readings, but it is not the
  same as raw/standard SDNN. Naming and analytics must keep that distinction.
- Forcing only central ROIs could hurt users/devices where an edge ROI has the
  cleanest signal. The plan therefore uses central preference plus quality
  fallback, not blind edge-ROI deletion.
- 30 FPS processing can increase CPU/battery cost. If target devices cannot
  sustain it, the detector must become sample-rate-aware instead of pretending
  the stream is 30 Hz.
- Cubic-spline upsampling can create a false sense of timing precision. Keep it
  only if ablation shows it improves peak consistency without increasing HRV
  variance.
- Database changes should be avoided unless persisted HRV confidence is required
  for historical/session-detail display.
- Saving both IBI and BPM samples is acceptable, but naming must stay clear:
  IBIs are canonical measurement data; BPM samples are derived display/cache
  data. Future code should not treat persisted BPM samples as HRV truth.

## Definition Of Done

- `FinalPpgAnalysis` exists and is the only final result policy boundary.
- Standalone HR and breath-hold results consume it.
- Final BPM, HRV, graph series, and persistence derive from one clean final IBI
  series.
- App-facing short-reading SDNN uses linear detrending, and raw SDNN remains
  available in diagnostics.
- Final HRV ROI selection prefers `full`, `center`, and `inner`, with edge ROIs
  reserved for clear quality wins or fallback.
- Result/detail/home BPM graphs use centralized presentation series.
- HRV confidence is displayed for marginal readings.
- UI no longer computes HRV fallback stats.
- Frame timestamp handling and peak timing precision are documented and tested.
- Measurement paths either process around 30 FPS or use measured sample-rate
  filter coefficients.
- Live filter coefficients are sample-rate-aware, with tests for lower-rate
  streams.
- The plan and docs describe cubic-spline upsampling as an optional peak
  refinement heuristic, not as proof of true 180 Hz physiological sampling.
- Measurement screens include concise guidance for stable finger pressure,
  stillness, and poor-signal retry behavior.
- Production HRV debug logs are removed or gated.
- Architecture docs are updated.
- The Phase 1.5 measurement note exists and documents the chosen
  preferred ROI/channel default.
- Presentation BPM series uses sliding mean, not median, with the chosen
  named policy, window radius, and clamp documented.
- Session persistence continues saving clean IBIs and derived BPM samples.
- The plan documents that removing BPM-sample writes is optional future cleanup,
  not required for this rewrite.
- `npm test` and `npx tsc --noEmit` pass.
