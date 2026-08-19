import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import ActivityGlyph from '../explore/ActivityGlyph';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type {
  GlyphShape,
  PlayfulHue,
} from '../../features/exercise/guidedBreathing/categoryPalette';

const TILE_SIZE = 46;
const GLYPH_SIZE = 24;
const BADGE_SIZE = 18;

interface Props {
  glyph: GlyphShape;
  hue: PlayfulHue;
  title: string;
  /** the line under the title: category, length, time of day */
  meta?: string;
  completed: boolean;
  /** dims the whole row for a day with nothing on it */
  muted?: boolean;
  onPress?: () => void;
}

export default function HistoryDayRow({
  glyph,
  hue,
  title,
  meta,
  completed,
  muted = false,
  onPress,
}: Props) {
  const body = (
    <>
      <View style={styles.tileWrap}>
        <View style={[styles.tile, { backgroundColor: hue.soft }]}>
          <ActivityGlyph shape={glyph} size={GLYPH_SIZE} color={hue.ink} />
        </View>
        {completed ? (
          <View style={styles.badge}>
            <Icon name="check" size={11} color={colors.text.inverse} />
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            completed && styles.titleCompleted,
            muted && styles.titleMuted,
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {meta == null ? null : (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>

      {onPress == null ? null : (
        <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
      )}
    </>
  );

  if (onPress == null) {
    return <View style={[card.base, card.shadow, styles.row]}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={meta == null ? title : `${title}, ${meta}`}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        card.base,
        card.shadow,
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  tileWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Overlaps the tile's lower-right corner, so it reads as a stamp on the
  // artwork rather than a fourth column in the row. Anchored to the tile, not
  // the card — a title that wraps to two lines grows the card, not the tile.
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[500],
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  titleCompleted: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  titleMuted: {
    color: colors.text.tertiary,
  },
  meta: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
});
