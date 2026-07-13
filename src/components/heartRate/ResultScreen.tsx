import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Pressable,
} from 'react-native';
import { Background2066 } from '../common/Background2066';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing, padding, margin } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { DataPoint } from '../analytics/LineGraph';
import SectionHeader from '../common/SectionHeader';
import StressGauge from './StressGauge';
import { getStressZone } from '../../lib/heartRate/stress';
import type { CaptureResult, HrvAvailabilityReason, IbiSample } from '../../lib/heartRate/types';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { HeartRateResultContent } from './HeartRateResultContent';
import {
  buildBpmSamplesFromIbiSamples,
  mapIbiSamples,
} from '../../lib/heartRate/sessionPayload';
import type { BpmTimePoint } from '../../lib/heartRate/bpmSeries';
import { useNavigation } from '@react-navigation/native';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useAuthStore } from '../../stores/authStore';
import { useProfileQuery } from '../../queries/profile/useProfileQuery';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type { RootStackNavigationProp } from '../../app/navigation';

interface ResultScreenProps {
  result: CaptureResult;
  onRetry: () => void;
  onDone: () => void | Promise<void>;
  isSaving?: boolean;
  saveError?: boolean;
  onRetrySave?: () => void;
  context?: string;
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence > 0.7) return { label: 'High Confidence', color: colors.success[500] };
  if (confidence > 0.4) return { label: 'Moderate Confidence', color: colors.warning[500] };
  return { label: 'Low Confidence', color: colors.error[500] };
}

function getErrorMessage(
  error: CaptureResult['error'],
): { title: string; message: string } {
  switch (error) {
    case 'low_confidence':
      return {
        title: 'Signal Was Noisy',
        message: 'Signal was too noisy for an accurate reading. Try again in a quiet position.',
      };
    case 'signal_lost':
      return {
        title: 'Finger Moved',
        message: 'Your finger moved during measurement. Try to keep it still for the full 45 seconds.',
      };
    case 'no_finger':
      return {
        title: 'No Finger Detected',
        message: 'We couldn\'t detect your finger. Cover the camera and flash fully, then try again.',
      };
    case 'too_few_samples':
      return {
        title: 'Not Enough Data',
        message: 'Not enough data was collected. Make sure your finger covers the camera and flash.',
      };
    case 'not_enough_signal':
      return {
        title: 'Not Enough Signal',
        message: 'Not enough signal was detected to calculate your heart rate. Cover the camera and flash fully, then try again.',
      };
    case 'camera_error':
      return {
        title: 'Camera Error',
        message: 'A camera error occurred. Please try again.',
      };
    default:
      return {
        title: 'Reading Unclear',
        message: 'We were unable to get a clear reading. Please try again.',
      };
  }
}

function downsampleIbi(
  samples: IbiSample[],
  toDataPoint: (s: IbiSample) => number,
  maxPoints = 24,
): DataPoint[] {
  if (samples.length === 0) return [];
  const fmt = (offsetMs: number) => `${Math.round(offsetMs / 1000)}s`;
  if (samples.length <= maxPoints) {
    return samples.map((s) => ({ label: fmt(s.offsetMs), value: toDataPoint(s) }));
  }
  const step = (samples.length - 1) / (maxPoints - 1);
  const out: DataPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const s = samples[Math.round(i * step)];
    out.push({ label: fmt(s.offsetMs), value: toDataPoint(s) });
  }
  return out;
}

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  iconColor?: string;
  caption?: string;
  captionColor?: string;
}

function StatCard({
  icon,
  label,
  value,
  unit,
  iconColor,
  caption,
  captionColor,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={iconColor ?? colors.primary.blue600}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
        {caption ? (
          <Text style={[styles.statCaption, captionColor ? { color: captionColor } : null]}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function getHrvUnavailableMessage(
  reason: HrvAvailabilityReason | undefined,
): string | null {
  switch (reason) {
    case 'not_enough_clean_beats':
      return 'HRV unavailable: not enough clean beats';
    case 'low_signal_quality':
      return 'HRV unavailable: low signal quality';
    default:
      return null;
  }
}

function ResultBackground() {
  return (
    <>
      {/* Fixed background image with quick fade to white */}
      <Background2066 style={styles.bgImage} />
      <LinearGradient
        colors={[
          'rgba(248,251,255,0)',
          'rgba(248,251,255,0.55)',
          'rgba(248,251,255,1)',
        ]}
        locations={[0, 0.25, 0.45]}
        style={styles.bgGradient}
        pointerEvents="none"
      />
    </>
  );
}

function buildResultBpmSamples(result: CaptureResult): BpmTimePoint[] {
  const presentationSamples = result.bpmSamples ?? [];
  if (presentationSamples.length >= 2) {
    return presentationSamples
      .filter((sample) => (
        Number.isFinite(sample.offsetMs) &&
        sample.offsetMs >= 0 &&
        Number.isFinite(sample.bpm) &&
        sample.bpm >= 20 &&
        sample.bpm <= 240
      ))
      .map((sample) => ({
        offsetMs: Math.round(sample.offsetMs),
        bpm: Math.round(sample.bpm),
      }));
  }

  return buildBpmSamplesFromIbiSamples(mapIbiSamples(result.ibiSamples ?? [])).map((sample) => ({
    offsetMs: sample.offset_ms,
    bpm: sample.bpm,
  }));
}

export function ResultScreen({
  result,
  onRetry,
  onDone,
  isSaving = false,
  saveError = false,
  onRetrySave,
  context,
}: ResultScreenProps) {
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp<'HeartRate'>>();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileQuery = useProfileQuery(userId);
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const showAdvancedStatsPaywall = () => {
    trackFeatureGateHit({
      feature: FeatureKey.AdvancedStats,
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'HeartRateResult',
      sourceAction: 'result_stats',
      access: advancedStatsAccess,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'HeartRateResult',
      sourceAction: 'result_stats',
      feature: FeatureKey.AdvancedStats,
    });
  };
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isSuccess = result.reading != null;
  const resultBpmSamples = useMemo(
    () => buildResultBpmSamples(result),
    [result],
  );

  useEffect(() => {
    if (isSuccess && result.reading) {
      posthog.capture(AnalyticsEvent.HeartRateCaptureCompleted, {
        context: context ?? null,
      });
    } else if (!isSuccess) {
      posthog.capture(AnalyticsEvent.HeartRateCaptureFailed, {
        error_type: result.error ?? 'unknown',
        context: context ?? null,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSuccess, scaleAnim, opacityAnim]);

  if (isSuccess && result.reading) {
    const reading = result.reading;
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ResultBackground />
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                posthog.capture(AnalyticsEvent.HeartRateResultAction, {
                  action: 'done',
                  previous_result: 'success',
                  context: context ?? null,
                });
                onDone();
              }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.text.secondary}
              />
            </Pressable>
            <Text style={styles.headerTitle}>Nice work!</Text>
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.heroContent}>
              <HeartRateResultContent
                bpm={reading.bpm}
                confidence={reading.confidence}
                sampleCount={reading.sampleCount}
                showHrv={result.mode !== 'quick'}
                showRestingHealthBar={result.mode === 'quick'}
                age={profileQuery.data?.age ?? null}
                rmssd={reading.rmssd ?? null}
                sdnn={reading.sdnn ?? null}
                hrDrop={reading.hrDrop ?? null}
                stress={reading.stress ?? null}
                hrvAvailabilityReason={reading.hrvAvailabilityReason}
                bpmSamples={resultBpmSamples}
                ibiSamples={result.ibiSamples ?? []}
                context={context}
                heartScale={scaleAnim}
                advancedStatsLocked={advancedStatsLocked}
                onPressUpgrade={showAdvancedStatsPaywall}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.successActions, { paddingBottom: insets.bottom + spacing.lg }]}>
            {saveError && (
              <View style={styles.saveErrorBanner}>
                <MaterialCommunityIcons
                  name="cloud-off-outline"
                  size={18}
                  color={colors.error[500]}
                />
                <Text style={styles.saveErrorText}>
                  Couldn't save reading. Check your connection.
                </Text>
                <Pressable
                  style={styles.saveErrorRetry}
                  onPress={() => onRetrySave?.()}
                >
                  <Text style={styles.saveErrorRetryText}>Retry</Text>
                </Pressable>
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              disabled={isSaving}
              onPress={() => {
                posthog.capture(AnalyticsEvent.HeartRateResultAction, {
                  action: 'retry',
                  previous_result: 'success',
                  context: context ?? null,
                });
                onRetry();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Check Again'}
              </Text>
            </TouchableOpacity>
          </View>
      </View>
    );
  }

  // Error state
  const errorInfo = getErrorMessage(result.error);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ResultBackground />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Error icon */}
          <View style={styles.errorIconContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color={colors.warning[500]}
            />
          </View>

          <Text style={styles.resultTitle}>Reading Unclear</Text>
          <Text style={styles.errorTitle}>{errorInfo.title}</Text>
          <Text style={styles.errorMessage}>{errorInfo.message}</Text>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsHeading}>Tips for a better reading:</Text>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color={colors.text.tertiary} />
              <Text style={styles.tipText}>Cover both the lens and flash fully</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color={colors.text.tertiary} />
              <Text style={styles.tipText}>Apply steady, gentle pressure</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="circle-small" size={16} color={colors.text.tertiary} />
              <Text style={styles.tipText}>Stay still for the full 45 seconds</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <View style={styles.errorActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              posthog.capture(AnalyticsEvent.HeartRateResultAction, {
                action: 'retry',
                previous_result: 'failure',
                error_type: result.error ?? 'unknown',
                context: context ?? null,
              });
              onRetry();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: padding.screen.vertical,
    left: padding.screen.horizontal,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  heroWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  heartIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.title.title1,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  bpmNumber: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 72,
    lineHeight: 80,
    color: colors.text.primary,
  },
  bpmUnit: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    ...typography.caption.caption1,
    fontWeight: '500',
  },
  sectionHeaderWrap: {
    width: '100%',
    marginTop: margin.resultSection,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    width: '100%',
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCardSpacer: {
    flex: 1,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.display.display3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  statUnit: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  statCaption: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  hrvUnavailableCard: {
    ...card.base,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  hrvUnavailableText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  contextCard: {
    ...card.base,
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: 2,
  },
  contextLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  contextValue: {
    ...typography.body.small,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
  },
  scrollFlex: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  gaugeWrap: {
    width: '100%',
    marginTop: spacing.sm,
  },
  graphCard: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    padding: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  graphTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.xs,
  },
  errorTitle: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsHeading: {
    ...typography.body.small,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
  errorActions: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  successActions: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
  },
  saveErrorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  saveErrorText: {
    ...typography.body.small,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  saveErrorRetry: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  saveErrorRetryText: {
    ...typography.body.small,
    color: colors.primary.blue600,
    fontFamily: fonts.semibold,
  },
});
