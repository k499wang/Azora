import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import TECHNIQUES, { type BreathingTechnique } from '../../data/techniques';
import SectionHeader from '../common/SectionHeader';

const CATEGORY_CONFIG = {
  calm: { label: 'Calm', color: colors.primary.blue500, bg: colors.primary.blue100 },
  focus: { label: 'Focus', color: colors.orange[600], bg: colors.orange[100] },
  energy: { label: 'Energy', color: colors.success[700], bg: colors.success[100] },
  sleep: { label: 'Sleep', color: colors.neutral[600], bg: colors.neutral[200] },
} as const;

function formatPattern(p: BreathingTechnique['pattern']) {
  return [p.inhale, p.holdIn, p.exhale, p.holdOut].filter((v) => v > 0).join('-');
}

function TechniqueCard({ technique }: { technique: BreathingTechnique }) {
  const navigation = useNavigation<any>();
  const cat = CATEGORY_CONFIG[technique.category];

  return (
    <Pressable
      onPress={() => navigation.navigate('ExerciseSession', { techniqueId: technique.id })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
          <MaterialCommunityIcons
            name={technique.icon as any}
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
        {TECHNIQUES.map((t) => (
          <TechniqueCard key={t.id} technique={t} />
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
    width: CARD_WIDTH,
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
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
