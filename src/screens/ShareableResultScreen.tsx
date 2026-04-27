import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import LineGraph, { DataPoint } from '../components/analytics/LineGraph';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateLungAge, type LungHealthKey } from '../lib/lungAge';

function downsampleSamples(
  samples: { t: number; bpm: number }[],
  maxPoints = 20,
): DataPoint[] {
  if (samples.length === 0) return [];
  if (samples.length <= maxPoints) {
    return samples.map((s) => ({ label: `${s.t}s`, value: s.bpm }));
  }
  const step = (samples.length - 1) / (maxPoints - 1);
  const out: DataPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    const s = samples[idx];
    out.push({ label: `${s.t}s`, value: s.bpm });
  }
  return out;
}

// ───────────��──────────────────────────────────────��─────────────────────────────

const LUNG_HEALTH_MAP: Record<
  LungHealthKey,
  { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  'elite':         { label: 'Elite Athlete', color: colors.primary.blue600, icon: 'trophy' },
  'very-healthy':  { label: 'Very Healthy',  color: colors.success[500],    icon: 'lungs' },
  'healthy':       { label: 'Healthy',       color: colors.success[700],    icon: 'leaf' },
  'average':       { label: 'Average',       color: colors.warning[500],    icon: 'minus-circle-outline' },
  'below-average': { label: 'Below Average', color: colors.orange[500],     icon: 'alert-circle-outline' },
  'light-smoker':  { label: 'Light Smoker',  color: colors.orange[600],     icon: 'smoking' },
  'heavy-smoker':  { label: 'Heavy Smoker',  color: colors.error[500],      icon: 'smoking-off' },
};

function formatTime(secs: number) {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ShareableResultScreen({
  navigation,
  route,
}: DailyResultScreenProps) {
  const insets = useSafeAreaInsets();
  const { holdSeconds, bpmSamples = [], avgBpm, minBpm, maxBpm } = route.params;
  const lungEstimate = estimateLungAge({ holdSeconds, avgBpm, minBpm });
  const health = LUNG_HEALTH_MAP[lungEstimate.key];
  const holdTime = formatTime(holdSeconds);

  const bpmData = downsampleSamples(bpmSamples);
  const hasBpm = bpmData.length > 0;
  const lowestIndex = hasBpm
    ? bpmData.indexOf(bpmData.reduce((min, p) => (p.value < min.value ? p : min), bpmData[0]))
    : -1;
  const avgBpmDisplay = avgBpm != null ? String(avgBpm) : '—';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.title}>Your Results</Text>
        </View>

        <View style={styles.lungHealthSection}>
          <View style={styles.lungMedallionOuter}>
            <View
              style={[
                styles.lungMedallionGlow,
                { backgroundColor: health.color + '14' },
              ]}
            />
            <View
              style={[
                styles.lungMedallion,
                { backgroundColor: health.color + '22', borderColor: health.color + '55' },
              ]}
            >
              <MaterialCommunityIcons
                name={health.icon}
                size={72}
                color={health.color}
              />
            </View>
          </View>

          <Text style={styles.lungCardLabel}>Estimated lung age</Text>
          <View style={styles.lungAgeRow}>
            <Text style={styles.lungAgeValue}>{lungEstimate.age}</Text>
            <Text style={styles.lungAgeUnit}>yrs</Text>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: health.color + '1A' }]}>
            <Text style={[styles.healthBadgeText, { color: health.color }]}>
              {health.label}
            </Text>
          </View>

          <View style={styles.lungChipRow}>
            <View style={styles.lungChip}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.lungChipValue}>{holdTime}</Text>
              <Text style={styles.lungChipLabel}>hold</Text>
            </View>
            {avgBpm != null ? (
              <View style={styles.lungChip}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.lungChipValue}>{avgBpm}</Text>
                <Text style={styles.lungChipLabel}>avg HR</Text>
              </View>
            ) : null}
            {lungEstimate.hrDropBpm != null ? (
              <View style={styles.lungChip}>
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.lungChipValue}>{lungEstimate.hrDropBpm}</Text>
                <Text style={styles.lungChipLabel}>HR drop</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.graphSection}>
          <Text style={styles.sectionTitle}>Heart Rate</Text>
          <View style={styles.card}>
            {hasBpm ? (
              <LineGraph
                data={bpmData}
                subtitle="BPM during breath hold"
                unit=""
                height={180}
                lineColor={colors.primary.blue500}
                fillColor={colors.primary.blue100}
                dotColor={colors.primary.blue600}
                highlightIndex={lowestIndex}
                highlightColor={colors.primary.blue600}
              />
            ) : (
              <View style={styles.emptyGraph}>
                <MaterialCommunityIcons
                  name="heart-off-outline"
                  size={28}
                  color={colors.text.tertiary}
                />
                <Text style={styles.emptyGraphTitle}>Heart rate not tracked</Text>
                <Text style={styles.emptyGraphBody}>
                  Tap "Track heart rate" before your next hold and place a finger over the rear
                  camera to capture your BPM live.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statCardTop}>
                <MaterialCommunityIcons name="timer-outline" size={18} color={colors.primary.blue600} />
                <Text style={styles.statLabel}>Hold Time</Text>
              </View>
              <Text style={styles.statValue}>{holdTime}</Text>
              <Text style={styles.statUnit}>minutes</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardTop}>
                <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.primary.blue600} />
                <Text style={styles.statLabel}>Avg HR</Text>
              </View>
              <Text style={styles.statValue}>{avgBpmDisplay}</Text>
              <Text style={styles.statUnit}>bpm</Text>
            </View>
          </View>

          {hasBpm && minBpm != null && maxBpm != null ? (
            <View style={[styles.statsRow, { marginTop: spacing.md }]}>
              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <MaterialCommunityIcons name="arrow-down" size={18} color={colors.primary.blue600} />
                  <Text style={styles.statLabel}>Min HR</Text>
                </View>
                <Text style={styles.statValue}>{minBpm}</Text>
                <Text style={styles.statUnit}>bpm</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <MaterialCommunityIcons name="arrow-up" size={18} color={colors.primary.blue600} />
                  <Text style={styles.statLabel}>Max HR</Text>
                </View>
                <Text style={styles.statValue}>{maxBpm}</Text>
                <Text style={styles.statUnit}>bpm</Text>
              </View>
            </View>
          ) : null}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Screen
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },

  // Header
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },

  // Lung Health Hero
  lungHealthSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    alignItems: 'center',
  },
  lungMedallionOuter: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  lungMedallionGlow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    opacity: 0.85,
  },
  lungMedallion: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lungCardLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lungAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: 2,
  },
  lungAgeValue: {
    ...typography.display.display1,
    fontSize: 64,
    lineHeight: 72,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  lungAgeUnit: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  healthBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  healthBadgeText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  lungChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  lungChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
  lungChipValue: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lungChipLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },

  // Graph
  graphSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  sectionTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    overflow: 'hidden',
  },

  // Stats
  statsSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    padding: spacing.md,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
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
    marginTop: 2,
  },

  emptyGraph: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 180,
  },
  emptyGraphTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  emptyGraphBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
