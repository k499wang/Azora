import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import ActivityGlyph from './ActivityGlyph';
import Icon from '../common/icons/Icon';
import { BREATH_HOLD_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const SESSION_DURATION = '~2 min';
const CARD_HEIGHT = 152;
const GLYPH_SIZE = 148;

interface DailyPlanCardProps {
  todayHoldSeconds: number | null;
  lastHoldSeconds: number | null;
  onPress: () => void;
}

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
    <View style={[styles.cardShadow, { backgroundColor: hue.base }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          doneToday ? 'Try another breath hold' : 'Start your daily breath hold'
        }
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
              Azora’s Breathhold Exercise
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
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    ...card.blockShadow,
  },
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
    right: -40,
    bottom: -46,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
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
    opacity: 0.8,
  },
  originalPill: {
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  originalPillText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
  },
  textBlock: {
    gap: spacing.xs,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    ...typography.label.detail,
  },
});
