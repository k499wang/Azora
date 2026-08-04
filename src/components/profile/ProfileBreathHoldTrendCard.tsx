import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';
import { LockedScrim } from '../common/glass';
import BreathHoldStatsRow from '../exercise/BreathHoldStatsRow';
import ActivityGlyph from '../explore/ActivityGlyph';
import { BREATH_HOLD_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';

const GLYPH_SIZE = 190;

interface ProfileBreathHoldTrendCardProps {
  data: DataPoint[];
  bestHoldSeconds: number | null;
  todayHoldSeconds: number | null;
  avgHoldSeconds: number | null;
  locked?: boolean;
  onPressLocked?: () => void;
}

export default function ProfileBreathHoldTrendCard({
  data,
  bestHoldSeconds,
  todayHoldSeconds,
  avgHoldSeconds,
  locked = false,
  onPressLocked,
}: ProfileBreathHoldTrendCardProps) {
  const bestIndex = useMemo(() => {
    if (data.length === 0) return undefined;

    let maxIndex = 0;
    let maxValue = data[0].value;

    data.forEach((point, index) => {
      if (point.value > maxValue) {
        maxValue = point.value;
        maxIndex = index;
      }
    });

    return maxIndex;
  }, [data]);

  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        <View
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        >
          <View style={styles.cardGlyph} pointerEvents="none">
            <ActivityGlyph
              shape={BREATH_HOLD_STYLE.glyph}
              size={GLYPH_SIZE}
              color={colors.text.inverse}
              opacity={0.12}
            />
          </View>

          <View style={styles.graph}>
            <LineGraph
              data={data}
              unit="s"
              height={210}
              highlightIndex={bestIndex}
              lineColor={colors.text.inverse}
              fillColor={colors.text.inverse}
              dotColor={colors.text.inverse}
              highlightColor={colors.text.inverse}
              dotStrokeColor={BREATH_HOLD_STYLE.hue.base}
              labelColor={colors.text.inverse}
              mutedLabelColor={colors.onBlock.textMuted}
              showXAxisLabels={false}
              valuePaddingRatio={0.04}
            />
          </View>

          <View style={styles.divider} />

          <BreathHoldStatsRow
            bestHoldSeconds={bestHoldSeconds}
            todayHoldSeconds={todayHoldSeconds}
            avgHoldSeconds={avgHoldSeconds}
          />
        </View>

        {locked ? (
          <>
            <LockedScrim />
            {onPressLocked ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Unlock breath hold progress"
                accessibilityHint="Opens the Pro upgrade screen"
                onPress={onPressLocked}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    ...card.blockShadow,
  },
  card: {
    ...card.block,
    backgroundColor: BREATH_HOLD_STYLE.hue.base,
    padding: spacing.lg,
  },
  cardGlyph: {
    position: 'absolute',
    right: -70,
    top: -76,
  },
  graph: {
    marginHorizontal: -spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.onBlock.divider,
    marginHorizontal: -spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
