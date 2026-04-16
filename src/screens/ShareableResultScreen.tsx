import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import LineGraph, { DataPoint } from '../components/analytics/LineGraph';
import AppTopBar from '../components/common/AppTopBar';

// ─── Edit these values to customise the shareable screen ───────────────────────

const LUNG_AGE = 23;
const LUNG_HEALTH: 'elite' | 'very-healthy' | 'healthy' | 'average' | 'below-average' | 'light-smoker' | 'heavy-smoker' = 'very-healthy';

const HOLD_TIME = '1:42';
const AVG_BPM = '64';

const BPM_DATA: DataPoint[] = [
  { label: '0s', value: 72 },
  { label: '10s', value: 68 },
  { label: '20s', value: 64 },
  { label: '30s', value: 60 },
  { label: '40s', value: 58 },
  { label: '50s', value: 62 },
  { label: '60s', value: 66 },
];

// ───────────��──────────────────────────────────────��─────────────────────────────

const LUNG_HEALTH_MAP = {
  'elite':          { label: 'Elite Athlete',  color: colors.primary.blue600, icon: 'trophy' as const },
  'very-healthy':   { label: 'Very Healthy',   color: colors.success[500],    icon: 'lungs' as const },
  'healthy':        { label: 'Healthy',         color: colors.success[700],    icon: 'leaf' as const },
  'average':        { label: 'Average',         color: colors.warning[500],    icon: 'minus-circle-outline' as const },
  'below-average':  { label: 'Below Average',   color: colors.orange[500],     icon: 'alert-circle-outline' as const },
  'light-smoker':   { label: 'Light Smoker',    color: colors.orange[600],     icon: 'smoking' as const },
  'heavy-smoker':   { label: 'Heavy Smoker',    color: colors.error[500],      icon: 'smoking-off' as const },
};

export default function ShareableResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const health = LUNG_HEALTH_MAP[LUNG_HEALTH];

  const lowestIndex = BPM_DATA.indexOf(
    BPM_DATA.reduce((min, p) => (p.value < min.value ? p : min), BPM_DATA[0])
  );

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      <AppTopBar />

      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
        </Pressable>
        <Text style={styles.title}>Your Results</Text>
      </View>

      {/* HERO: Lung Health */}
      <View style={styles.lungHealthSection}>
        <View style={[styles.lungHealthRing, { borderColor: health.color }]}>
          <MaterialCommunityIcons name={health.icon} size={46} color={health.color} />
          <View style={styles.lungAgeRow}>
            <Text style={styles.lungAgeLabel}>LUNG AGE</Text>
            <Text style={[styles.lungAgeValue, { color: health.color }]}>{LUNG_AGE}</Text>
          </View>
        </View>

        <View style={[styles.healthBadge, { backgroundColor: health.color + '18' }]}>
          <Text style={[styles.healthBadgeText, { color: health.color }]}>
            {health.label}
          </Text>
        </View>

      </View>

      {/* Heart Rate Graph */}
      <View style={styles.graphSection}>
        <Text style={styles.sectionTitle}>Heart Rate</Text>
        <View style={styles.card}>
          <LineGraph
            data={BPM_DATA}
            subtitle="BPM during breath hold"
            unit=""
            height={180}
            lineColor={colors.primary.blue500}
            fillColor={colors.primary.blue100}
            dotColor={colors.primary.blue600}
            highlightIndex={lowestIndex}
            highlightColor={colors.primary.blue600}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={styles.statCardTop}>
              <MaterialCommunityIcons name="timer-outline" size={18} color={colors.primary.blue600} />
              <Text style={styles.statLabel}>Hold Time</Text>
            </View>
            <Text style={styles.statValue}>{HOLD_TIME}</Text>
            <Text style={styles.statUnit}>minutes</Text>
            <View style={[styles.statAccent, styles.statAccentBlue]} />
          </View>

          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={styles.statCardTop}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.primary.blue600} />
              <Text style={styles.statLabel}>Avg HR</Text>
            </View>
            <Text style={styles.statValue}>{AVG_BPM}</Text>
            <Text style={styles.statUnit}>bpm</Text>
            <View style={[styles.statAccent, styles.statAccentBlue]} />
          </View>
        </View>
      </View>

      {/* Done button */}
      <View style={styles.doneSection}>
        <Pressable
          style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  },

  // Lung Health Hero
  lungHealthSection: {
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  lungHealthRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lungAgeRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  lungAgeLabel: {
    ...typography.overline,
    color: colors.text.tertiary,
    letterSpacing: 1.5,
  },
  lungAgeValue: {
    ...typography.display.display1,
    textAlign: 'center',
  },
  healthBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  healthBadgeText: {
    ...typography.label.large,
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
    backgroundColor: colors.background.elevated,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
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
    flex: 1,
    borderRadius: 18,
    padding: spacing.md,
    overflow: 'hidden',
  },
  statCardBlue: {
    backgroundColor: colors.background.accentSoft,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...typography.label.small,
    color: colors.primary.blue600,
  },
  statValue: {
    ...typography.display.display3,
    color: colors.text.primary,
  },
  statUnit: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statAccentBlue: {
    backgroundColor: colors.primary.blue500,
  },

  // Done
  doneSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  doneButton: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 18,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  doneButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  doneButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
