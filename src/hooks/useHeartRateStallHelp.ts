import { useCallback, useEffect, useRef, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import type { HeartRateCaptureMode } from '../lib/heartRate/captureModes';
import type { FingerPlacementState, SignalStatus } from '../lib/heartRate/types';
import {
  classifyStallIssue,
  dominantStallIssue,
  HEART_RATE_STALL_DELAY_MS,
  type HeartRateStallIssue,
  type HeartRateStallSample,
} from '../lib/heartRate/captureStall';

interface UseHeartRateStallHelpOptions {
  /** The window where a pulse is expected but not yet found. */
  active: boolean;
  pulseConfirmed: boolean;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  context?: string | null;
  mode?: HeartRateCaptureMode;
}

interface UseHeartRateStallHelpReturn {
  visible: boolean;
  /** Stays true after dismissal — the read that follows was a rescued one. */
  shown: boolean;
  dismiss: () => void;
}

/**
 * Watches a pulse search and surfaces the help sheet once it has run
 * `HEART_RATE_STALL_DELAY_MS` without ever locking on. Shows at most once per
 * active window; a confirmed pulse stands it down for good.
 */
export function useHeartRateStallHelp({
  active,
  pulseConfirmed,
  fingerPlacement,
  signalStatus,
  context,
  mode,
}: UseHeartRateStallHelpOptions): UseHeartRateStallHelpReturn {
  const posthog = usePostHog();
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const samplesRef = useRef<HeartRateStallSample[]>([]);
  const lastIssueRef = useRef<HeartRateStallIssue | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read at fire time, so a mode or context change can't restart the countdown.
  const reportRef = useRef({ posthog, context, mode });
  reportRef.current = { posthog, context, mode };

  const clearStallTimer = useCallback(() => {
    if (timerRef.current == null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) {
      clearStallTimer();
      setVisible(false);
      return;
    }

    samplesRef.current = [];
    lastIssueRef.current = null;
    setShown(false);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const issue = dominantStallIssue(samplesRef.current, Date.now());
      setShown(true);
      setVisible(true);
      const report = reportRef.current;
      report.posthog.capture(AnalyticsEvent.HeartRateCaptureHelpShown, {
        issue,
        mode: report.mode ?? null,
        context: report.context ?? null,
      });
    }, HEART_RATE_STALL_DELAY_MS);

    return clearStallTimer;
  }, [active, clearStallTimer]);

  // Which fault held longest decides the advice, so every change is timestamped.
  useEffect(() => {
    if (!active) return;
    const issue = classifyStallIssue(fingerPlacement, signalStatus);
    if (issue === lastIssueRef.current) return;
    lastIssueRef.current = issue;
    samplesRef.current.push({ issue, atMs: Date.now() });
  }, [active, fingerPlacement, signalStatus]);

  // A confirmed pulse settles the search: stand down and get out of the way.
  useEffect(() => {
    if (!pulseConfirmed) return;
    clearStallTimer();
    setVisible(false);
  }, [clearStallTimer, pulseConfirmed]);

  const dismiss = useCallback(() => setVisible(false), []);

  return { visible, shown, dismiss };
}
