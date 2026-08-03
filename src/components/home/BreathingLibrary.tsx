import { Text } from '../common/Text';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import { card } from '../../theme/card';
import TECHNIQUES, { type BreathingTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { CATEGORY_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';
import ActivityGlyph from './ActivityGlyph';
import Icon from '../common/icons/Icon';
import SectionHeader from '../common/SectionHeader';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { useAuthStore } from '../../stores/authStore';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useRecommendedTechnique } from '../../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type { FeatureAccessResult } from '../../services/subscriptions/featureAccess';
import type { MainTabNavigationProp } from '../../app/navigation';

type ExerciseGroupId = 'sleep-calm' | 'mental-reset' | 'focus-energy';

const CATEGORY_GROUP: Record<BreathingTechnique['category'], ExerciseGroupId> = {
  sleep: 'sleep-calm',
  calm: 'sleep-calm',
  balance: 'mental-reset',
  focus: 'focus-energy',
  energy: 'focus-energy',
};

const EXERCISE_GROUPS: ReadonlyArray<{
  id: ExerciseGroupId;
  title: string;
}> = [
  { id: 'sleep-calm', title: 'Sleep & Calm' },
  { id: 'focus-energy', title: 'Focus & Energy' },
  { id: 'mental-reset', title: 'Find Your Balance' },
];

function formatPattern(p: BreathingTechnique['pattern']) {
  return [p.inhale, p.holdIn, p.exhale, p.holdOut].filter((v) => v > 0).join('-');
}

function TechniqueCard({
  technique,
  recommended = false,
  exerciseAccess,
}: {
  technique: BreathingTechnique;
  recommended?: boolean;
  exerciseAccess: FeatureAccessResult & { isLoading: boolean };
}) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const posthog = usePostHog();
  const style = CATEGORY_STYLE[technique.category];
  const textColor = colors.text.inverse;

  const handlePress = () => {
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
        sourceScreen: 'Home',
        sourceAction: 'breathing_library',
        access: exerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Home',
        sourceAction: 'breathing_library',
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.cardShadow, { backgroundColor: style.hue.base }]}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.cardGlyph} pointerEvents="none">
            <ActivityGlyph
              shape={style.glyph}
              size={GLYPH_SIZE}
              color={textColor}
              opacity={0.16}
            />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.category, { color: textColor }]}>
                {style.label}
              </Text>
              {recommended ? (
                <View style={styles.recommendedPill}>
                  <Text style={[styles.recommendedText, { color: style.hue.ink }]}>
                    For you
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.techniqueName, { color: textColor }]} numberOfLines={2}>
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
    </View>
  );
}

export default function BreathingLibrary() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const recommendedTechnique = useRecommendedTechnique(userId);
  const recommendedTechniqueId =
    recommendedTechnique.source === 'profile'
      ? recommendedTechnique.technique?.id ?? null
      : null;

  const orderedTechniques = useMemo(() => {
    if (recommendedTechniqueId == null) return TECHNIQUES;
    const recommended = TECHNIQUES.find((t) => t.id === recommendedTechniqueId);
    if (recommended == null) return TECHNIQUES;
    return [recommended, ...TECHNIQUES.filter((t) => t.id !== recommendedTechniqueId)];
  }, [recommendedTechniqueId]);

  const exerciseGroups = useMemo(
    () =>
      EXERCISE_GROUPS.map((group) => ({
        ...group,
        techniques: orderedTechniques.filter(
          (technique) => CATEGORY_GROUP[technique.category] === group.id,
        ),
      })),
    [orderedTechniques],
  );

  return (
    <View style={styles.section}>
      {exerciseGroups.map((group) => (
        <View key={group.id} style={styles.exerciseGroup}>
          <View style={styles.headerWrap}>
            <SectionHeader title={group.title} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + spacing.xs * 2}
          >
            {group.techniques.map((technique) => (
              <TechniqueCard
                key={technique.id}
                technique={technique}
                recommended={technique.id === recommendedTechniqueId}
                exerciseAccess={exerciseAccess}
              />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const CARD_WIDTH = 184;
const CARD_HEIGHT = 208;
const GLYPH_SIZE = 148;

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  exerciseGroup: {
    gap: spacing.md,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  scrollContent: {
    paddingHorizontal: padding.screen.horizontal - spacing.xs,
    paddingBottom: spacing.sm,
  },
  cardWrapper: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  cardShadow: {
    ...card.blockShadow,
  },
  card: {
    ...card.block,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
  recommendedPill: {
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  recommendedText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
  },
  textBlock: {
    gap: spacing.xs,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  techniqueName: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
  },
  category: {
    ...typography.overline,
    opacity: 0.8,
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
