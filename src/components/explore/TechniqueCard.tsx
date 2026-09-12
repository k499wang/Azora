import { Pressable, StyleSheet, View } from 'react-native';
import {
  CATEGORY_STYLE,
  TECHNIQUE_GLYPH,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import {
  formatPattern,
  type BreathingTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import {
  useOpenBreathingTechnique,
  type BreathingTechniqueSourceAction,
  type BreathingTechniqueSourceScreen,
} from '../../features/exercise/shared/hooks/useOpenBreathingTechnique';
import type { FeatureAccessState } from '../../hooks/useFeatureAccess';
import { card, softColoredCard } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import ActivityGlyph from './ActivityGlyph';
import ExerciseSearchResultRow from './ExerciseSearchResultRow';

export const TECHNIQUE_SHELF_CARD_WIDTH = 228;
const SHELF_CARD_HEIGHT = 254;
const SHELF_GLYPH_SIZE = 180;

interface TechniqueCardProps {
  technique: BreathingTechnique;
  recommended?: boolean;
  exerciseAccess: FeatureAccessState;
  layout: 'shelf' | 'search';
  sourceScreen: BreathingTechniqueSourceScreen;
  sourceAction: BreathingTechniqueSourceAction;
}

export default function TechniqueCard({
  technique,
  recommended = false,
  exerciseAccess,
  layout,
  sourceScreen,
  sourceAction,
}: TechniqueCardProps) {
  const categoryStyle = CATEGORY_STYLE[technique.category];
  const textColor = categoryStyle.hue.ink;
  const accessHint =
    !exerciseAccess.allowed && !exerciseAccess.isLoading
      ? 'Opens the Pro upgrade screen'
      : 'Starts this reset';

  const handlePress = useOpenBreathingTechnique({
    technique,
    recommended,
    exerciseAccess,
    sourceScreen,
    sourceAction,
  });

  if (layout === 'search') {
    return (
      <ExerciseSearchResultRow
        title={technique.name}
        metadata={technique.duration}
        hue={categoryStyle.hue}
        glyph={TECHNIQUE_GLYPH[technique.id]}
        accessibilityLabel={`${technique.name}, ${categoryStyle.label}, ${technique.duration}${recommended ? ', recommended for you' : ''}`}
        accessibilityHint={accessHint}
        onPress={handlePress}
      />
    );
  }

  return (
    <View style={styles.shelfWrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${technique.name}, ${categoryStyle.label}, ${technique.duration}${recommended ? ', recommended for you' : ''}`}
        accessibilityHint={accessHint}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          styles.shelfCard,
          softColoredCard(categoryStyle.hue),
          pressed && styles.cardPressed,
        ]}
      >
        <View
          style={styles.shelfGlyph}
          pointerEvents="none"
        >
          <ActivityGlyph
            shape={TECHNIQUE_GLYPH[technique.id]}
            size={SHELF_GLYPH_SIZE}
            color={textColor}
            opacity={0.1}
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.category, { color: textColor }]}>
              {categoryStyle.label}
            </Text>
            {recommended ? (
              <View
                style={[
                  styles.recommendedPill,
                  { backgroundColor: categoryStyle.hue.ink },
                ]}
              >
                <Text
                  style={[
                    styles.recommendedText,
                    { color: categoryStyle.hue.tint },
                  ]}
                >
                  For you
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.textBlock}>
            <Text
              style={[styles.techniqueName, { color: textColor }]}
              numberOfLines={2}
            >
              {technique.name}
            </Text>
            <View style={[styles.metaRow, { opacity: 0.85 }]}>
              <Icon name="timer" size={14} color={textColor} />
              <Text style={[styles.meta, { color: textColor }]}>
                {technique.duration} · {formatPattern(technique.pattern)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shelfWrapper: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    ...card.block,
  },
  shelfCard: {
    width: TECHNIQUE_SHELF_CARD_WIDTH,
    height: SHELF_CARD_HEIGHT,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  shelfGlyph: {
    position: 'absolute',
    right: -42,
    bottom: -48,
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
  recommendedPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  recommendedText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
  textBlock: {
    gap: 2,
  },
  techniqueName: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 23,
  },
  category: {
    ...typography.overline,
    textTransform: 'none',
    letterSpacing: 0.4,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
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
