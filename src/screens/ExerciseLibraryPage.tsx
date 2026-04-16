import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding } from '../theme/spacing';
import TECHNIQUES, { type BreathingTechnique } from '../data/techniques';
import AppTopBar from '../components/common/AppTopBar';

const CATEGORY_CONFIG = {
  calm: { label: 'Calm', color: colors.primary.blue500, bg: colors.primary.blue100 },
  focus: { label: 'Focus', color: colors.orange[600], bg: colors.orange[100] },
  energy: { label: 'Energy', color: colors.success[700], bg: colors.success[100] },
  sleep: { label: 'Sleep', color: colors.neutral[600], bg: colors.neutral[200] },
} as const;

function formatPattern(p: BreathingTechnique['pattern']) {
  return [p.inhale, p.holdIn, p.exhale, p.holdOut].filter((v) => v > 0).join(' - ');
}

function TechniqueCard({ technique }: { technique: BreathingTechnique }) {
  const navigation = useNavigation<any>();
  const cat = CATEGORY_CONFIG[technique.category];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate('ExerciseSession', { techniqueId: technique.id })}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
          <MaterialCommunityIcons
            name={technique.icon as any}
            size={22}
            color={cat.color}
          />
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
        </View>
      </View>

      <Text style={styles.cardName}>{technique.name}</Text>
      <Text style={styles.cardDesc}>{technique.description}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.patternRow}>
          <MaterialCommunityIcons name="timer-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.patternText}>{formatPattern(technique.pattern)}</Text>
        </View>
        <Text style={styles.durationText}>{technique.duration}</Text>
      </View>
    </Pressable>
  );
}

export default function ExerciseLibraryPage() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#F0E6F6', '#E8EEF8', colors.background.primary]} locations={[0, 0.4, 0.75]} style={StyleSheet.absoluteFill} />
      <AppTopBar />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {TECHNIQUES.map((t) => (
          <TechniqueCard key={t.id} technique={t} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    borderRadius: 50,
    paddingHorizontal: spacing.sm + spacing.xs / 2,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    ...typography.label.small,
  },
  cardName: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  patternText: {
    ...typography.label.small,
    color: colors.text.tertiary,
  },
  durationText: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
});
