import { Text } from '../../../../components/common/Text';
import { StyleSheet, View } from 'react-native';
import { LiveSignalGraph } from '../../../../components/heartRate/LiveSignalGraph';
import { HeartRatePlacementGuidance } from './ExerciseHeartRateGuidance';
import type {
  FingerPlacementState,
  SignalStatus,
} from '../../../../lib/heartRate/types';
import type { LiveSignalSource } from '../../../../lib/heartRate/liveSignalSource';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
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
  beatTick: number;
  signalSource: LiveSignalSource;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

/**
 * The measuring screen. Deliberately characterless — the companion is held back
 * until a pulse is locked, so its arrival is the reward for a good reading.
 */
export default function HeartRatePlacementStage({
  theme,
  viewport,
  bpm,
  beatTick,
  signalSource,
  fingerPlacement,
  signalStatus,
}: HeartRatePlacementStageProps) {
  const previewTop = pulsePreviewTop(viewport);
  // Clears the lens window, plus room for the reading the graph hangs above
  // itself.
  const columnTop = previewTop + PULSE_PREVIEW_SIZE + spacing['4xl'];

  return (
    <View style={styles.stage} pointerEvents="none">
      <Text
        style={[
          styles.title,
          { color: theme.textPrimary, top: previewTop - spacing['3xl'] },
        ]}
      >
        Finding your pulse
      </Text>

      <View style={[styles.column, { top: columnTop }]}>
        <LiveSignalGraph
          signalSource={signalSource}
          fingerPlacement={fingerPlacement}
          signalStatus={signalStatus}
          bpm={bpm}
          beatTick={beatTick}
          textColor={theme.textPrimary}
        />
        <HeartRatePlacementGuidance
          theme={theme}
          fingerPlacement={fingerPlacement}
          signalStatus={signalStatus}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    ...typography.title.title2,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  column: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
});
