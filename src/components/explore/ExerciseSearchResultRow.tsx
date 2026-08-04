import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type {
  GlyphShape,
  PlayfulHue,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import ActivityGlyph from './ActivityGlyph';

interface ExerciseSearchResultRowProps {
  title: string;
  metadata: string;
  hue: PlayfulHue;
  glyph: GlyphShape;
  badge?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
}

export default function ExerciseSearchResultRow({
  title,
  metadata,
  hue,
  glyph,
  badge,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: ExerciseSearchResultRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: hue.base },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.thumbnail, { backgroundColor: hue.soft }]}>
        <ActivityGlyph
          shape={glyph}
          size={58}
          color={hue.ink}
          opacity={0.82}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: hue.ink }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metadataRow}>
          <Icon name="timer" size={14} color={colors.onBlock.textMuted} />
          <Text style={styles.metadata} numberOfLines={1}>
            {metadata}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.onBlock.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 18,
  },
  rowPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  thumbnail: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
  badge: {
    flexShrink: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
  },
  badgeText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadata: {
    ...typography.label.medium,
    flex: 1,
    color: colors.onBlock.textMuted,
    fontFamily: fonts.medium,
  },
});
