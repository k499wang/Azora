import { Pressable, StyleSheet, View } from 'react-native';
import type {
  GlyphShape,
  PlayfulHue,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, coloredCard } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import ActivityGlyph from './ActivityGlyph';

const CARD_HEIGHT = 88;
const GLYPH_SIZE = 150;

interface ExploreActionCardProps {
  title: string;
  subtitle: string;
  hue: PlayfulHue;
  /** Bled off the corner, the same treatment the shelf cards give their glyph. */
  glyph: GlyphShape;
  accessibilityLabel: string;
  accessibilityHint: string;
  onPress: () => void;
}

export default function ExploreActionCard({
  title,
  subtitle,
  hue,
  glyph,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: ExploreActionCardProps) {
  const textColor = colors.text.inverse;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
        style={({ pressed }) => [
          styles.card,
          coloredCard(hue),
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
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
            <Text
              style={[styles.subtitle, { color: textColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={textColor} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: padding.screen.horizontal,
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
    bottom: -50,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  textBlock: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 19,
    lineHeight: 24,
  },
  subtitle: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    opacity: 0.85,
  },
});
