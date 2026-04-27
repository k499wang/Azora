import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { DataPoint } from '../analytics/LineGraph';
import SectionHeader from '../common/SectionHeader';
import StressGauge from './StressGauge';
import { getStressZone } from '../../lib/heartRate/stress';
import type { CaptureResult, HrvAvailabilityReason, IbiSample } from '../../lib/heartRate/types';
import { AnalyticsEvent } from '../../services/analytics/events';

interface ResultScreenProps {
  result: CaptureResult;
  onRetry: () => void;
  onDone: () => void;
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
    case 'too_few_samples':
      return {
        title: 'Not Enough Data',
        message: 'Not enough data was collected. Make sure your finger covers the camera and flash.',
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

export function ResultScreen({ result, onRetry, onDone, context }: ResultScreenProps) {
  const posthog = usePostHog();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  const isSuccess = result.reading != null;

  useEffect(() => {
    if (isSuccess && result.reading) {
      posthog.capture(AnalyticsEvent.HeartRateCaptureCompleted, {
        bpm: result.reading.bpm,
        confidence: result.reading.confidence,
        duration_ms: result.reading.durationMs,
        sample_count: result.reading.sampleCount,
        rmssd_ms: result.reading.rmssd ?? null,
        stress: result.reading.stress ?? null,
        sdnn_ms: result.reading.sdnn ?? null,
        hrv_availability_reason: result.reading.hrvAvailabilityReason ?? null,
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

    if (isSuccess) {
      // Heart pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulse, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulse, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSuccess, scaleAnim, opacityAnim, heartPulse]);

  if (isSuccess && result.reading) {
    const reading = result.reading;
    const confidence = getConfidenceLabel(reading.confidence);
    const rmssdValue =
      reading.rmssd != null && Number.isFinite(reading.rmssd)
        ? `${Math.round(reading.rmssd)}`
        : null;
    const stressValue = reading.stress?.toString() ?? null;
    const hrvUnavailableMessage = getHrvUnavailableMessage(reading.hrvAvailabilityReason);

    const stats: StatCardProps[] = [
      {
        icon: 'pulse',
        label: 'Samples',
        value: `${reading.sampleCount}`,
      },
    ];
    if (rmssdValue != null) {
      stats.push({
        icon: 'heart-pulse',
        label: 'RMSSD',
        value: rmssdValue,
        unit: 'ms',
        iconColor: colors.error[500],
      });
    }
    const stressZone =
      reading.stress != null ? getStressZone(reading.stress) : null;

    const statRows: StatCardProps[][] = [];
    for (let i = 0; i < stats.length; i += 2) {
      statRows.push(stats.slice(i, i + 2));
    }

    const ibiSamples = result.ibiSamples ?? [];
    const bpmSeries = downsampleIbi(ibiSamples, (s) =>
      s.ibiMs > 0 ? Math.round(60000 / s.ibiMs) : 0,
    );
    const rrSeries = downsampleIbi(ibiSamples, (s) => Math.round(s.ibiMs));
    const hasGraphs = ibiSamples.length >= 2;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <Animated.View
            style={[
              styles.content,
              { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
            ]}
          >
            {/* Heart icon */}
            <Animated.View style={{ transform: [{ scale: heartPulse }] }}>
              <View style={styles.heartIconContainer}>
                <MaterialCommunityIcons
                  name="heart"
                  size={56}
                  color={colors.error[500]}
                />
              </View>
            </Animated.View>

            <Text style={styles.resultTitle}>Heart Rate</Text>

            {/* BPM display */}
            <View style={styles.bpmContainer}>
              <Text style={styles.bpmNumber}>{reading.bpm}</Text>
              <Text style={styles.bpmUnit}>bpm</Text>
            </View>

            {/* Confidence badge */}
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidence.color}15` }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidence.color }]} />
              <Text style={[styles.confidenceText, { color: confidence.color }]}>
                {confidence.label}
              </Text>
            </View>

            <View style={styles.sectionHeaderWrap}>
              <SectionHeader title="Heart statistics" />
            </View>

            <View style={styles.statsGrid}>
              {statRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.statsRow}>
                  {row.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                  ))}
                  {row.length === 1 ? <View style={styles.statCardSpacer} /> : null}
                </View>
              ))}
            </View>

            {stressZone != null && reading.stress != null ? (
              <View style={styles.gaugeWrap}>
                <StressGauge value={reading.stress} zone={stressZone} />
              </View>
            ) : null}

            {rmssdValue == null && stressValue == null && hrvUnavailableMessage != null ? (
              <View style={styles.hrvUnavailableCard}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.hrvUnavailableText}>{hrvUnavailableMessage}</Text>
              </View>
            ) : null}

            {context != null ? (
              <View style={styles.contextCard}>
                <Text style={styles.contextLabel}>Context</Text>
                <Text style={styles.contextValue}>{context}</Text>
              </View>
            ) : null}

            {hasGraphs ? (
              <>
                <View style={styles.graphCard}>
                  <Text style={styles.graphTitle}>Heart rate</Text>
                  <LineGraph
                    data={bpmSeries}
                    subtitle="BPM during the reading"
                    unit=""
                    height={180}
                    lineColor={colors.primary.blue500}
                    fillColor={colors.primary.blue100}
                    dotColor={colors.primary.blue600}
                  />
                </View>

                <View style={styles.graphCard}>
                  <Text style={styles.graphTitle}>Heart rate variability</Text>
                  <LineGraph
                    data={rrSeries}
                    subtitle="RR intervals (ms) — wider swings = more variability"
                    unit=""
                    height={180}
                    lineColor={colors.error[500]}
                    fillColor={`${colors.error[500]}1A`}
                    dotColor={colors.error[500]}
                  />
                </View>
              </>
            ) : null}
          </Animated.View>
          </ScrollView>

          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.primaryButton}
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
              <Text style={styles.primaryButtonText}>Check Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                posthog.capture(AnalyticsEvent.HeartRateResultAction, {
                  action: 'done',
                  previous_result: 'success',
                  context: context ?? null,
                });
                onDone();
              }}
              activeOpacity={0.7}
              style={styles.cancelTouchable}
            >
              <Text style={styles.cancelText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  const errorInfo = getErrorMessage(result.error);

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <TouchableOpacity
            onPress={() => {
              posthog.capture(AnalyticsEvent.HeartRateResultAction, {
                action: 'cancel',
                previous_result: 'failure',
                error_type: result.error ?? 'unknown',
                context: context ?? null,
              });
              onDone();
            }}
            activeOpacity={0.7}
            style={styles.cancelTouchable}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
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
    fontWeight: '600',
  },
  sectionHeaderWrap: {
    width: '100%',
    marginTop: spacing.lg,
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
    fontWeight: '600',
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
    alignItems: 'center',
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
    fontWeight: '600',
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
    paddingVertical: 16,
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
  },
  cancelTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
