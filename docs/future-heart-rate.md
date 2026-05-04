 Here's a deep critique of accuracy in your BPM and HRV pipeline. I read src/lib/heartRate/signalProcessing.ts, src/lib/heartRate/heartRateManager.ts,
  src/lib/heartRate/bpmSmoothing.ts, and src/lib/hrv.ts, and cross-checked against literature on smartphone-PPG HRV (Kubios preprocessing guidance, Malik filter,   
  PPG-vs-ECG validation studies).                                                                                                                                   
                                                                                                                                                                    
  BPM accuracy                                                                                                                                                      
                                                                                                                                                                    
  1. Sub-bin frequency resolution lost. frequencyEstimate (signalProcessing.ts:343) sweeps Goertzel at FREQ_STEP = 0.01 Hz then does Math.round(peakFreq * 60). With
   a 0.01 Hz grid the BPM resolution is already ±0.6 BPM, and rounding to integer throws away another bit. Fit a parabola to (score[peak-1], score[peak], 
  score[peak+1]) and use the apex (you already have this exact helper for time-domain peaks at interpolatePeakOffset, line 620). This typically halves frequency    
  error at no cost.

  2. Sample-rate clamp distorts time base. estimateSampleRate at line 252 returns Math.round(1000/medianDelta) clamped to [15, 30] Hz. iPhone PPG plugins usually   
  deliver ~30 fps with non-integer effective rates (29.7, 30.1). Rounding to integer Hz introduces a fixed phase drift across an 8 s window. Keep fs as a float and
  use it as-is in the resampler step 1000/fs.                                                                                                                       
                  
  3. Resampling uses linear interpolation. resampleUniform at line 269 is linear. PPG peaks are sharp; linear interpolation under-resolves them and biases peak     
  timestamps by up to ½ sample. Either (a) cubic-spline interpolate, or (b) skip resampling for peak detection and run the detector onraw timestamps, only
  resampling for the FFT/Goertzel path. Welltory and Kubios both interpolate sub-sample around the peak after detection.                                            
                  
  4. 30 fps quantizes IBIs. At 30 Hz, the IBI quantum is 33 ms. Without sub-sample peak refinement, RMSSD has a noise floor near 10–15 ms — comparable to healthy   
  resting RMSSD itself. You already do parabolic refinement (refinedBeatTimestampsFromPeaks, line 628) — good. Make sure the iOS plugin runs at 60 fps where the
  device supports it (AVCaptureDevice.activeVideoMinFrameDuration); this halves the quantization noise floor and is the single biggest accuracy lever for HRV from a
   phone camera.  

  5. Channel mix is sub-optimal for fingertip + flash. weightedChannelValue is r*0.67 + g*0.33 (signalProcessing.ts:241, heartRateManager.ts:141). For transmissive 
  fingertip PPG with flash, the AC/DC ratio is highest in the green band even though red has the highest DC. Most published smartphonePPG pipelines (Welltory, the
  IEEE 8856540 paper you'd find in the search results) prefer green or the green/red ratio. Worth A/B-testing g vs the current weighted blend on real captures.     
                  
  6. Live BPM slew-rate limit hides reality. bpmSmoothing.ts:21 MAX_SAMPLE_JUMP_BPM = 8 clamps every step to ±8 BPM. That's too aggressive — during recovery from a 
  breath hold or exercise, true HR changes can exceed 8 BPM/sec. A median-of-N (you already have GRAPH_BPM_MEDIAN_WINDOW = 5) is the right tool; the slew clamp
  should be reserved for outlier rejection, not baseline smoothing. Replace clampStep with: pass-through if median(window) is within tolerance, otherwise use the   
  median.         

  7. Lighting drift gate is loose. MAX_LIGHTING_DRIFT_RATIO = 0.30 (line 20) allows 30% DC drift across an 8 s window before rejection. A finger that's slowly      
  rolling off the lens will pass this and bias the spectrum. Tighten to ~0.10–0.15 and surface a "hold finger steady" hint at runtime.
                                                                                                                                                                    
  HRV accuracy    \

  8. SDNN is computed wrong. hrv.ts:82 is stddev(linearDetrend(ibi)). Standard SDNN is the SD of raw NN intervals over the recording — detrending removes the very  
  low-frequency variance that SDNN is supposed to capture (it's the whole-recording variability metric). Drop the linearDetrend for SDNN. (You can keep it for
  spectral analysis if you ever add LF/HF.)                                                                                                                         
                  
  9. Mean HR formula is biased. Line 87: meanHr = 60000 / mean(ibi). Convention in HRV tools is mean(60000 / ibi) — the average of instantaneous HRs. The two differ
   on non-stationary segments (e.g. during recovery), and the instantaneous-HR average is what almost every reference (Kubios, mhrv) uses.
                                                                                                                                                                    
  10. minHr / maxHr are single-sample extremes. Lines 93–94 use Math.max(...ibi) / Math.min(...ibi) — a single noisy IBI defines the bound. Use the 5th/95th        
  percentile of 60000/ibi, or a rolling 3-beat median min/max. This is the same complaint Kubios makes about reporting raw extremes for short recordings.
                                                                                                                                                                    
  11. Rejected IBIs are dropped, not interpolated. In cleanBeatSeries (signalProcessing.ts:650) and the upstream Malik-style filter (heartRateManager.ts:407), a    
  rejected interval is simply skipped. RMSSD then gets computed across what is effectively a stitched timeline — ibi[i] and ibi[i-1] may not be physically adjacent.
   Kubios's standard approach is cubic-spline interpolation of the gap to restore a continuous NN series before computing time-domain stats. Without it, every      
  rejection silently skews RMSSD.

  12. Malik threshold is set to 25% in two places. MALIK_THRESHOLD = 0.2 (heartRateManager.ts:31) is correct, but HRV_INTERVAL_CLEANUP_THRESHOLD = 0.25 in          
  signalProcessing.ts:29 is a parallel implementation at a looser threshold. Pick one: classical Malik is 0.20, Kubios's adaptive (5.2 × QD of 90 surrounding beats)
   is more robust on real data. Two filters at different thresholds is the worst of both.                                                                           
                  
  13. Capture window too short for stable HRV. MIN_DURATION_MS = 8000, HRV_CAPTURE_OPTIONS.minDurationMs = 8000. Short-term HRV per Task Force standards needs ≥2   
  min, ideally 5 min. RMSSD on 8 s of data has a confidence interval of roughly ±20–30%. Either extend captures (60 s minimum is the common compromise that PPG apps
   like Welltory and HRV4Training use) or label the displayed values as "indicative" rather than absolute.                                                          
                  
  14. Stress index isn't Baevsky's. stress = 0.7 * rmssdScore + 0.3 * hrScore (line 89) is a custom heuristic. Baevsky's SI (commonly cited as "stress index" in HRV
   papers) is AMo / (2 × Mo × MxDMn). Either rename your field (stressHeuristic) or implement the standard so the number is comparableacross tools.
                                                                                                                                                                    
  15. No signal-quality gate on the final HRV output. extractBestCaptureBeatSeries returns whatever hrvCandidatePriority ranks highest, even if                     
  rejectedIntervalCount / rawIntervalCount is high. A practical gate: if rejection ratio > 20% or ibiMs.length < 30, mark the reading "low confidence" and don't
  display RMSSD as a precise number.                                                                                                                                
                  
  Recommended fixes, ranked by accuracy impact                                                                                                                      
  
  1. Run the camera at 60 fps where device-supported. Single biggest win for HRV — halves the IBI quantum.                                                          
  2. Cubic-spline interpolate rejected IBIs before computing RMSSD/SDNN/pNN50.
  3. Fix SDNN — remove linearDetrend.                                                                                                                               
  4. Fix mean HR — use mean(60000/ibi).                                                                                                                             
  5. Parabolic interpolation on the Goertzel peak (signalProcessing.ts:343) to get sub-bin frequency resolution.                                                    
  6. Unify the artifact filter (one Malik or one Kubios-adaptive, not both at different thresholds).                                                                
  7. Replace the ±8 BPM live slew clamp with a median+outlier policy.                                                                                               
  8. Test green-channel-only vs the current weighted blend for fingertip captures.                                                                                  
  9. Quality-gate displayed HRV on rejection ratio and beat count.                                                                                                  
  10. Extend the HRV capture to ≥60 s or down-rank single-shot accuracy claims in copy.                                                                             
                                                                                                                                                                    
  Sources:                                                                                                                                                          
  - Kubios — HRV preprocessing                                                                                                                                      
  - Kubios — Beat detection and HRV time series                                                                                        
  captures (60 s minimum is the common compromise that PPG apps like Welltory and HRV4Training use) or label the displayed values as
  "indicative" rather than absolute.

  14. Stress index isn't Baevsky's. stress = 0.7 * rmssdScore + 0.3 * hrScore (line 89) is a custom heuristic. Baevsky's SI (commonly
  cited as "stress index" in HRV papers) is AMo / (2 × Mo × MxDMn). Either rename your field (stressHeuristic) or implement the
  standard so the number is comparable across tools.

  15. No signal-quality gate on the final HRV output. extractBestCaptureBeatSeries returns whatever hrvCandidatePriority ranks highest,
   even if rejectedIntervalCount / rawIntervalCount is high. A practical gate: if rejection ratio > 20% or ibiMs.length < 30, mark the
  reading "low confidence" and don't display RMSSD as a precise number.

  Recommended fixes, ranked by accuracy impact

  1. Run the camera at 60 fps where device-supported. Single biggest win for HRV — halves the IBI quantum.
  2. Cubic-spline interpolate rejected IBIs before computing RMSSD/SDNN/pNN50.
  3. Fix SDNN — remove linearDetrend.
  4. Fix mean HR — use mean(60000/ibi).
  5. Parabolic interpolation on the Goertzel peak (signalProcessing.ts:343) to get sub-bin frequency resolution.
  6. Unify the artifact filter (one Malik or one Kubios-adaptive, not both at different thresholds).
  7. Replace the ±8 BPM live slew clamp with a median+outlier policy.
  8. Test green-channel-only vs the current weighted blend for fingertip captures.
  9. Quality-gate displayed HRV on rejection ratio and beat count.
  10. Extend the HRV capture to ≥60 s or down-rank single-shot accuracy claims in copy.

  Sources:
  - Kubios — HRV preprocessing
  - Kubios — Beat detection and HRV time series
  - Kubios — HRV analysis methods
  - Smartphone PPG: signal processing, quality assessment, and impact on HRV parameters (PubMed)
  - Extraction of HRV from Smartphone Photoplethysmograms (PMC)
  - Validity of Smartphone HRV Pre/Post Resistance Exercise (PMC)
  - Comprehensive review of HR via remote PPG and deep learning (PMC)
  - Marco Altini — Artifact Removal for PPG-Based HRV
  - Two-step preprocessing for Gaussian + ectopic noise (Nature)
  - physiozoo/mhrv MATLAB toolbox (reference implementation)


  Highest-Impact Improvements

  1. Use real sample rate everywhere.
      - src/lib/heartRate/heartRateManager.ts:36 hardcodes SAMPLE_RATE_HZ = 30, but src/hooks/useHeartRateCapture.ts:25 targets 45 FPS.
      - This can distort the live bandpass filter and peak timing behavior.
      - Make the live manager estimate frame cadence from timestamps and design/update filters from measured sample rate, or process at
        a true fixed 30 FPS consistently.
  2. Prefer a derivative-based fiducial point for HRV intervals.
      - Current HRV peak timing uses waveform peaks with parabolic refinement.
      - Research suggests PPG HRV timing can improve when using the maximum first derivative fiducial point rather than the peak,
        because the peak is broader and more pressure/exposure sensitive.
      - Add an HRV-specific beat timestamp extractor that compares peak, valley, and max first derivative candidates, then chooses the
        most stable one per ROI/channel.
  3. Raise the bar for HRV availability.
      - Current minimum is 15 clean intervals in src/lib/heartRate/captureResult.ts:5.
      - For “as accurate as possible,” require more: at least 30 clean intervals, low rejection ratio, stable sample rate, stable
        lighting, and agreement between two independent ROI/channel beat series.
      - If this makes HRV unavailable more often, that is the correct tradeoff.
  4. Store/report HRV quality metadata.
      - Persist roiId, channel, snrDb, confidence, rawIntervalCount, rejectedIntervalCount, sample-rate stats, and chosen fiducial
        type.
      - Without this, you cannot validate field accuracy or debug bad readings.
  5. Add device validation against ECG or a chest strap.
      - Build a small validation harness that exports raw PpgFrameSample[], extracted beat timestamps, final BPM, RMSSD, SDNN, and
        reference RR data.
  6. Consider longer HRV capture mode.
      - Keep 45 seconds for quick user flows.
      - Add an optional 2-5 minute “precision HRV” mode.
      - Standard HRV guidance is built around 5-minute short-term recordings; 45 seconds can be useful for trends, especially RMSSD,
        but it should not be treated as equivalent.

  Research Notes

  - The 1996 Task Force standards define RMSSD, SDNN, pNN50, and standard HRV measurement conventions, with 5-minute short-term record
    ings as the classic reference frame:
    https://www.escardio.org/static-file/Escardio/Guidelines/Scientific-Statements/guidelines-Heart-Rate-Variability-FT-1996.pdf
  - Smartphone fingertip PPG can measure heart rate accurately; one validation study found fingertip PPG RMSE around 1-2 bpm against E
    CG in healthy young adults: https://pubmed.ncbi.nlm.nih.gov/28288955/
  - Smartphone PPG-derived PRV can correlate with ECG HRV, but it is not identical to ECG HRV; PRV often has bias, especially for shor
    t-term variability metrics: https://pubmed.ncbi.nlm.nih.gov/25685174/
  - One smartphone PRV study used 240 Hz capture and reported small RMSSD/SDNN errors; that matters because this app is around 30-45 F
    PS, much lower temporal resolution: https://pmc.ncbi.nlm.nih.gov/articles/PMC5832098/
  - A 2024 review found PRV metrics need roughly 100-200 Hz for under 2% bias, while 40-50 Hz may still have under 20% bias. That makes
    the app’s 30-45 FPS HRV inherently limited: https://pubmed.ncbi.nlm.nih.gov/38610260/
  - Kubios’ artifact correction guidance is much richer than the current local median rejection and is a good model for missed/extra/m
    isaligned beat cleanup: https://www.kubios.com/blog/preprocessing-of-hrv-data/

  Summary Of Learnings
  The architecture is already pointed in the right direction: final BPM uses batch analysis, and final HRV uses a batch-selected beat
  series. The biggest accuracy gaps are not the RMSSD/SDNN formulas; they are sampling-rate consistency, beat fiducial timing, stricter
  HRV eligibility, artifact correction, and lack of real ECG/strap validation data.