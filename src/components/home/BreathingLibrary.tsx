import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import { card } from '../../theme/card';
import TECHNIQUES, { type BreathingTechnique } from '../../data/techniques';
import SectionHeader from '../common/SectionHeader';
import { AnalyticsEvent } from '../../services/analytics/events';
import { useAuthStore } from '../../stores/authStore';
import { useUserDefaultTechniqueQuery } from '../../queries/profile/useUserDefaultTechniqueQuery';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
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

  const handlePress = () => {
    posthog.capture(AnalyticsEvent.BreathingTechniqueSelected, {
      technique_id: technique.id,
      technique_name: technique.name,
      technique_category: technique.category,
      pattern: formatPattern(technique.pattern),
      recommended,
    });

    if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Home',
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
          recommended && { borderColor: cat.color, borderWidth: 1.5 },
          pressed && styles.cardPressed,
        ]}
      >
        <MaterialCommunityIcons
          name={technique.icon}
          size={22}
          color={cat.color}
          style={styles.icon}
        />
        <View style={styles.textBlock}>
          <Text style={styles.category}>{cat.label}</Text>
          <Text style={styles.pattern}>{formatPattern(technique.pattern)}</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function BreathingLibrary() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const { data: defaultTechniqueId } = useUserDefaultTechniqueQuery(userId);

  const orderedTechniques = useMemo(() => {
    if (defaultTechniqueId == null) return TECHNIQUES;
    const recommended = TECHNIQUES.find((t) => t.id === defaultTechniqueId);
    if (recommended == null) return TECHNIQUES;
    return [recommended, ...TECHNIQUES.filter((t) => t.id !== defaultTechniqueId)];
  }, [defaultTechniqueId]);

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
        snapToInterval={CARD_WIDTH + spacing.sm}
      >
        {orderedTechniques.map((t) => (
          <TechniqueCard
            key={t.id}
            technique={t}
            recommended={t.id === defaultTechniqueId}
            exerciseAccess={exerciseAccess}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 132;
const CARD_HEIGHT = 168;

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
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
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  icon: {
    alignSelf: 'flex-start',
  },
  textBlock: {
    gap: spacing.xs,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  category: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  pattern: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    opacity: 0.7,
  },
});
