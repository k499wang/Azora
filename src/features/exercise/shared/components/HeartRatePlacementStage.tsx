import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '../../../../components/common/Text';
import { usePlacementFade } from '../hooks/usePlacementFade';
import { FindingPulseHint } from '../../../../components/heartRate/FindingPulseHint';
import { LiveSignalGraph } from '../../../../components/heartRate/LiveSignalGraph';
import { placementCorrection } from './ExerciseHeartRateGuidance';
import type {
  FingerPlacementState,
  SignalStatus,
} from '../../../../lib/heartRate/types';
import type { LiveSignalSource } from '../../../../lib/heartRate/liveSignalSource';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { padding, spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export const PULSE_PREVIEW_SIZE = 148;
export const PULSE_PREVIEW_RING = 3;

/**
 * The camera itself is mounted by the presentation and outlives this screen, so
 * both agree on where the lens window sits.
 */
export function pulsePreviewTop(viewport: number): number {
  return viewport * 0.28;
}

interface HeartRatePlacementStageProps {
  theme: ExerciseDarkTheme;
  viewport: number;
  bpm: number | null;
  signalSource: LiveSignalSource;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

/**
 * The measuring screen. Deliberately characterless — the companion is held back
 * until a pulse is locked, so its arrival is the reward for a good reading.
 *
 * The message is anchored to the gap above the lens window rather than to a
 * fixed offset, so a wrapped line grows upward instead of running into it.
 * The reading itself is withheld until the session opens: the placement window
 * closes moments after the lock, and a number shown here would only flash.
 */
export default function HeartRatePlacementStage({
  theme,
  viewport,
  bpm,
  signalSource,
  fingerPlacement,
  signalStatus,
}: HeartRatePlacementStageProps) {
  const previewTop = pulsePreviewTop(viewport);
  const traceTop = previewTop + PULSE_PREVIEW_SIZE + spacing['2xl'];

  const fade = usePlacementFade(true);
  const correction = placementCorrection(signalStatus, fingerPlacement);
  const hasPulse = bpm != null && bpm > 0;

  return (
    <Animated.View
      style={[styles.stage, { opacity: fade }]}
      pointerEvents="none"
    >
      <View style={[styles.titleSlot, { height: previewTop - spacing.lg }]}>
        {hasPulse ? (
          <Text style={[styles.title, { color: theme.textAccent }]}>
            Pulse found
          </Text>
        ) : correction != null ? (
          <Text style={[styles.title, { color: colors.warning[500] }]}>
            {correction}
          </Text>
        ) : (
          <FindingPulseHint
            textStyle={[styles.title, { color: theme.textPrimary }]}
          />
        )}
      </View>

      <View style={[styles.traceSlot, { top: traceTop }]}>
        <LiveSignalGraph
          signalSource={signalSource}
          fingerPlacement={fingerPlacement}
          signalStatus={signalStatus}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
  },
  // Bottom-aligned: the message stacks upward from the gap above the lens, so a
  // wrapped line can never reach into the window.
  titleSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: padding.screen.horizontal,
  },
  traceSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
  title: {
    ...typography.title.title2,
    textAlign: 'center',
  },
});
