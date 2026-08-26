import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import ActivityGlyph from './ActivityGlyph';
import Icon from '../common/icons/Icon';
import { BREATH_HOLD_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';
import { card } from '../../theme/card';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const SESSION_DURATION = '~2 min';
const CARD_HEIGHT = 196;
const GLYPH_SIZE = 186;

type DailyPlanCardProps = {
  todayHoldSeconds: number | null;
  lastHoldSeconds: number | null;
  onPress: () => void;
};

function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DailyPlanCard({
  todayHoldSeconds,
  lastHoldSeconds,
  onPress,
}: DailyPlanCardProps) {
  const { hue, glyph, label } = BREATH_HOLD_STYLE;
  const doneToday = todayHoldSeconds != null;
  const hasHistory = lastHoldSeconds != null || doneToday;
  const textColor = colors.text.inverse;

  const status = !hasHistory
    ? null
    : doneToday
      ? `Done today ${formatMmSs(todayHoldSeconds)}`
      : `Last hold ${formatMmSs(lastHoldSeconds!)}`;

  const meta = status ? `${status} · ${SESSION_DURATION}` : SESSION_DURATION;

  return (
    <Pressable
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={
        doneToday ? 'Run the Azora Protocol again' : 'Start the Azora Protocol'
      }
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: hue.base },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardGlyph} pointerEvents="none">
        <ActivityGlyph
          shape={glyph}
          size={GLYPH_SIZE}
          color={textColor}
          opacity={0.16}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={[styles.category, { color: textColor }]}>{label}</Text>
          <View style={styles.originalPill}>
            <Text style={[styles.originalPillText, { color: hue.ink }]}>
              Azora Original
            </Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
            Azora Protocol
          </Text>
          <View style={[styles.metaRow, { opacity: 0.85 }]}>
            <Icon name="timer" size={14} color={textColor} />
            <Text style={[styles.meta, { color: textColor }]} numberOfLines={1}>
              {meta}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.block,
    height: CARD_HEIGHT,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardGlyph: {
    position: 'absolute',
    right: -50,
    bottom: -58,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  category: {
    ...typography.overline,
    textTransform: 'none',
    letterSpacing: 0.4,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    opacity: 0.8,
  },
  originalPill: {
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  originalPillText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
  textBlock: {
    gap: 2,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
  },
});
