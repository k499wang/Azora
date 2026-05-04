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
import type { MainTabNavigationProp } from '../../app/navigation';

const CATEGORY_CONFIG = {
  calm: { label: 'Calm', color: colors.primary.blue500, bg: colors.primary.blue100 },
  focus: { label: 'Focus', color: colors.orange[600], bg: colors.orange[100] },
  energy: { label: 'Energy', color: colors.success[700], bg: colors.success[100] },
  sleep: { label: 'Sleep', color: colors.neutral[600], bg: colors.neutral[200] },
} as const;

function formatPattern(p: BreathingTechnique['pattern']) {
  return [p.inhale, p.holdIn, p.exhale, p.holdOut].filter((v) => v > 0).join('-');
}

function TechniqueCard({
  technique,
  recommended = false,
}: {
  technique: BreathingTechnique;
  recommended?: boolean;
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
    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        recommended && styles.cardRecommended,
        pressed && styles.cardPressed,
      ]}
    >
      {recommended ? (
        <View style={styles.recommendedPill}>
          <Text style={styles.recommendedText}>For you</Text>
        </View>
      ) : null}
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
          <MaterialCommunityIcons
            name={technique.icon}
            size={22}
            color={cat.color}
          />
        </View>
        <View style={[styles.categoryPill, { backgroundColor: cat.bg }]}>
          <Text style={[styles.categoryPillText, { color: cat.color }]}>{cat.label}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {technique.name}
      </Text>
      <Text style={styles.meta}>{formatPattern(technique.pattern)}</Text>
    </Pressable>
  );
}

export default function BreathingLibrary() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
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
          />
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 160;

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  scrollContent: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  card: {
    ...card.base,
    width: CARD_WIDTH,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardRecommended: {
    borderColor: colors.primary.blue600,
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  recommendedPill: {
    position: 'absolute',
    top: -8,
    left: spacing.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
    zIndex: 1,
  },
  recommendedText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.text.inverse,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryPillText: {
    ...typography.label.small,
    fontWeight: '600',
  },
  name: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  meta: {
    ...typography.label.small,
    color: colors.text.tertiary,
  },
});
