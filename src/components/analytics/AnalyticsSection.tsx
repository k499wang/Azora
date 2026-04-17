import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding, margin } from '../../theme/spacing';
import BarGraph from './BarGraph';

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `${fmt(monday)} – ${fmt(sunday)}`;
}

const ANALYTICS_DATA = [
  { label: 'Mon', value: 56 },
  { label: 'Tue', value: 72 },
  { label: 'Wed', value: 64 },
  { label: 'Thu', value: 88 },
  { label: 'Fri', value: 81 },
  { label: 'Sat', value: 97 },
  { label: 'Sun', value: 90 },
];

export default function AnalyticsSection() {
  const weekRange = useMemo(() => getCurrentWeekRange(), []);

  const best = useMemo(() => {
    let maxVal = -1;
    let maxIdx = 0;
    ANALYTICS_DATA.forEach((d, i) => {
      if (d.value > maxVal) {
        maxVal = d.value;
        maxIdx = i;
      }
    });
    return { index: maxIdx, value: maxVal };
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Breath hold trend</Text>
            <Text style={styles.cardSubtitle}>{weekRange}</Text>
          </View>
          <View style={styles.bestBadge}>
            <Text style={styles.bestLabel}>Best</Text>
            <Text style={styles.bestValue}>{best.value}s</Text>
          </View>
        </View>
        <BarGraph
          data={ANALYTICS_DATA}
          unit="s"
          barColor={colors.primary.blue500}
          highlightIndex={best.index}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  title: {
    ...typography.title.title2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  cardSubtitle: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  bestBadge: {
    alignItems: 'center',
    backgroundColor: colors.orange[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bestLabel: {
    ...typography.caption.caption1,
    color: colors.orange[700],
    fontWeight: '600',
  },
  bestValue: {
    ...typography.title.title3,
    color: colors.orange[700],
  },
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
});
