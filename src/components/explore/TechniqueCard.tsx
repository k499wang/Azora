import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RootStackNavigationProp } from '../../app/navigation';
import {
  CATEGORY_STYLE,
  TECHNIQUE_GLYPH,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import {
  formatPattern,
  type BreathingTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type { FeatureAccessResult } from '../../services/subscriptions/featureAccess';
import { card } from '../../theme/card';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import ActivityGlyph from './ActivityGlyph';
import ExerciseSearchResultRow from './ExerciseSearchResultRow';

export const TECHNIQUE_SHELF_CARD_WIDTH = 232;
const SHELF_CARD_HEIGHT = 262;
const SHELF_GLYPH_SIZE = 186;

interface TechniqueCardProps {
  technique: BreathingTechnique;
  recommended?: boolean;
  exerciseAccess: FeatureAccessResult & { isLoading: boolean };
  layout: 'shelf' | 'search';
  sourceScreen: 'Explore' | 'ExerciseSearch' | 'Home';
  sourceAction:
    | 'breathing_library'
    | 'exercise_search_result'
    | 'extra_practice';
}

export default function TechniqueCard({
  technique,
  recommended = false,
  exerciseAccess,
  layout,
  sourceScreen,
  sourceAction,
}: TechniqueCardProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const posthog = usePostHog();
  const categoryStyle = CATEGORY_STYLE[technique.category];
  const textColor = colors.text.inverse;
  const accessHint =
    !exerciseAccess.allowed && !exerciseAccess.isLoading
      ? 'Opens the Pro upgrade screen'
      : 'Starts this reset';

  const handlePress = () => {
    triggerTapHaptic();
    posthog.capture(AnalyticsEvent.BreathingTechniqueSelected, {
      technique_id: technique.id,
      technique_name: technique.name,
      technique_category: technique.category,
      pattern: formatPattern(technique.pattern),
      recommended,
    });

    if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
      trackFeatureGateHit({
        feature: FeatureKey.DailyExercise,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        access: exerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };

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
          { backgroundColor: categoryStyle.hue.base },
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
            opacity={0.16}
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.category, { color: textColor }]}>
              {categoryStyle.label}
            </Text>
            {recommended ? (
              <View style={styles.recommendedPill}>
                <Text
                  style={[
                    styles.recommendedText,
                    { color: categoryStyle.hue.ink },
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
  recommendedPill: {
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
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
    fontSize: 20,
    lineHeight: 26,
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
