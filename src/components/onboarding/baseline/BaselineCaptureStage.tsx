import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentCameraRing } from '../../heartRate/PersistentCameraRing';
import { LiveSignalGraph } from '../../heartRate/LiveSignalGraph';
import type { HeartRateCameraPreviewProps } from '../../heartRate/HeartRateCameraPreview';
import type {
  FingerPlacementState,
  LivePpgSignalSample,
} from '../../../lib/heartRate/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

export interface BaselinePlacementConfig {
  ringColor: string;
  status: string;
}

interface BaselineCaptureStageProps {
  bpmDisplay: number | null;
  bpmOpacity: Animated.Value;
  cameraProps?: Omit<HeartRateCameraPreviewProps, 'fingerPlacement'>;
  fingerPlacement: FingerPlacementState;
  heartScale: Animated.Value;
  hudOpacity: Animated.Value;
  hudVisible: boolean;
  isRunning: boolean;
  liveSignalSamples: LivePpgSignalSample[];
  onCancel: () => void;
  onShowHud: () => void;
  placement: BaselinePlacementConfig;
  progress: number;
  remainingSec: number;
  signalWarning: string | null;
  visibleBeatTick: number;
}

export function BaselineCaptureStage({
  bpmDisplay,
  bpmOpacity,
  cameraProps,
  fingerPlacement,
  heartScale,
  hudOpacity,
  hudVisible,
  isRunning,
  liveSignalSamples,
  onCancel,
  onShowHud,
  placement,
  progress,
  remainingSec,
  signalWarning,
  visibleBeatTick,
}: BaselineCaptureStageProps) {
  const insets = useSafeAreaInsets();
  const isFingerLost = fingerPlacement === 'lost' || fingerPlacement === 'no_finger';
  const showInlineSignalWarning = signalWarning != null && !isFingerLost;

  return (
    <View
      style={[
        styles.fill,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {isRunning && !hudVisible ? (
        <Pressable
          style={styles.tapToRevealLayer}
          onPress={onShowHud}
          accessibilityLabel="Show controls"
        />
      ) : null}

      <View style={styles.measureContainer}>
        <View style={styles.topArea}>
          {isRunning && isFingerLost ? (
            <View style={styles.warningBanner}>
              <MaterialCommunityIcons
                name="alert-outline"
                size={16}
                color={colors.warning[500]}
              />
              <Text style={styles.warningBannerText}>
                Finger moved - reposition and hold still
              </Text>
            </View>
          ) : null}
          {!isRunning ? (
            <Text style={[styles.hintText, { color: placement.ringColor }]}>
              {placement.status}
            </Text>
          ) : null}
          {isRunning && !isFingerLost ? (
            <View style={styles.liveSignalSlot}>
              <LiveSignalGraph
                samples={liveSignalSamples}
                fingerPlacement={fingerPlacement}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.ringSlot}>
          <PersistentCameraRing
            ringColor={placement.ringColor}
            trackColor={isRunning ? undefined : placement.ringColor + '33'}
            progress={isRunning ? progress : 0}
            cameraProps={cameraProps}
            fingerPlacement={fingerPlacement}
            beatTick={visibleBeatTick}
            showHeartIcon={isRunning}
            smoothProgress={isRunning}
          />
        </View>

        <View style={styles.bottomArea}>
          {isRunning ? (
            <View style={styles.metricStack}>
              {bpmDisplay != null ? (
                <BaselineCaptureMetric
                  bpm={bpmDisplay}
                  bpmOpacity={bpmOpacity}
                  heartScale={heartScale}
                  dimmed={signalWarning != null}
                />
              ) : null}
              {showInlineSignalWarning ? (
                <View style={styles.warningRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={12}
                    color={colors.warning[500]}
                  />
                  <Text style={styles.warningText}>{signalWarning}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.metricPlaceholder} />
          )}

          <Animated.View
            style={[
              styles.measureActions,
              isRunning ? { opacity: hudOpacity } : null,
            ]}
          >
            <View style={[styles.timePill, !isRunning && styles.hiddenPlaceholder]}>
              <Text style={styles.timeValue}>{remainingSec}s</Text>
            </View>
            <View style={[styles.progressBar, !isRunning && styles.hiddenPlaceholder]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancel,
                pressed && styles.skipPressed,
              ]}
            >
              <Text style={styles.skipText}>
                {isRunning ? 'End early' : 'Cancel'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

export default BaselineCaptureStage;

interface BaselineCaptureMetricProps {
  bpm: number;
  bpmOpacity: Animated.Value;
  dimmed: boolean;
  heartScale: Animated.Value;
}

function BaselineCaptureMetric({
  bpm,
  bpmOpacity,
  dimmed,
  heartScale,
}: BaselineCaptureMetricProps) {
  return (
    <View style={[styles.bpmRow, dimmed && styles.bpmRowDim]}>
      <Animated.Text
        style={[
          styles.bpmNumber,
          dimmed ? null : { opacity: bpmOpacity },
        ]}
      >
        {bpm}
      </Animated.Text>
      <Text style={[styles.bpmUnit, dimmed && styles.bpmUnitDim]}>bpm</Text>
      <Animated.View
        style={dimmed ? null : { transform: [{ scale: heartScale }] }}
      >
        <MaterialCommunityIcons
          name="heart"
          size={18}
          color={dimmed ? colors.text.tertiary : colors.error[500]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tapToRevealLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  measureContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  topArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  liveSignalSlot: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ringSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  metricStack: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricPlaceholder: {
    minHeight: 48,
  },
  hintText: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
  },
  warningBannerText: {
    ...typography.body.small,
    color: '#92400E',
    flex: 1,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bpmRowDim: {
    opacity: 0.25,
  },
  bpmNumber: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0,
    color: colors.text.primary,
  },
  bpmUnit: {
    ...typography.caption.caption1,
    marginLeft: -4,
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  bpmUnitDim: {
    color: colors.text.tertiary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningText: {
    ...typography.caption.caption1,
    fontFamily: fonts.medium,
    color: colors.warning[700],
  },
  measureActions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  timePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  timeValue: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 3,
    width: '70%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  hiddenPlaceholder: {
    opacity: 0,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});
