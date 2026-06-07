import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import { card } from '../../theme/card';
import TECHNIQUES, { type BreathingTechnique } from '../../data/techniques';
import SectionHeader from '../common/SectionHeader';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { useAuthStore } from '../../stores/authStore';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useRecommendedTechnique } from '../../hooks/useRecommendedTechnique';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type { FeatureAccessResult } from '../../services/subscriptions/featureAccess';
import type { MainTabNavigationProp } from '../../app/navigation';

const CATEGORY_CONFIG = {
  calm: { label: 'Calm', color: colors.primary.blue600, bg: colors.primary.blue100 },
  focus: { label: 'Focus', color: colors.primary.blue600, bg: colors.primary.blue100 },
  energy: { label: 'Energy', color: colors.primary.blue600, bg: colors.primary.blue100 },
  sleep: { label: 'Sleep', color: colors.primary.blue600, bg: colors.primary.blue100 },
  balance: { label: 'Balance', color: colors.primary.blue600, bg: colors.primary.blue100 },
} as const;

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
  const cat = CATEGORY_CONFIG[technique.category];
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
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          recommended && styles.recommendedCard,
          pressed && styles.cardPressed,
        ]}
      >
        <Image source={technique.backgroundImage} style={styles.cardImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.55)']}
          locations={[0.35, 1]}
          style={styles.cardScrim}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <MaterialCommunityIcons
              name={technique.icon}
              size={26}
              color={textColor}
              style={styles.icon}
            />
            {recommended ? (
              <View style={styles.recommendedPill}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.techniqueName, { color: textColor }]} numberOfLines={2}>
              {technique.name}
            </Text>
            <Text style={[styles.category, { color: textColor, opacity: 0.85 }]}>{cat.label}</Text>
            <Text style={[styles.pattern, { color: textColor, opacity: 0.8 }]}>
              {formatPattern(technique.pattern)}
            </Text>
          </View>
        </View>
      </Pressable>
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

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Breathing exercises" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.xs * 2}
      >
        {orderedTechniques.map((t) => (
          <TechniqueCard
            key={t.id}
            technique={t}
            recommended={t.id === recommendedTechniqueId}
            exerciseAccess={exerciseAccess}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 240;
const CARD_HEIGHT = 288;

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  scrollContent: {
    paddingHorizontal: padding.screen.horizontal - spacing.xs,
    paddingVertical: spacing.sm,
  },
  cardWrapper: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    shadowColor: colors.primary.blue500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    ...card.base,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  recommendedCard: {
    borderColor: colors.primary.blue500,
    borderWidth: 2,
  },
  cardTop: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  icon: {
    alignSelf: 'flex-start',
  },
  recommendedPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  recommendedText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  textBlock: {
    gap: spacing.xs,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  techniqueName: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
  },
  category: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  pattern: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    opacity: 0.7,
  },
});
