import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { BreathingTechnique } from '../../data/techniques';

interface Props {
  technique: BreathingTechnique;
}

const PHASE_META: {
  key: keyof BreathingTechnique['pattern'];
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { key: 'inhale', label: 'Inhale', icon: 'arrow-up-bold' },
  { key: 'holdIn', label: 'Hold', icon: 'pause' },
  { key: 'exhale', label: 'Exhale', icon: 'arrow-down-bold' },
  { key: 'holdOut', label: 'Hold', icon: 'pause' },
];

export default function TechniqueIntro({ technique }: Props) {
  const phases = PHASE_META.filter((p) => technique.pattern[p.key] > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{technique.name}</Text>
      <Text style={styles.description}>{technique.description}</Text>

      <View style={styles.phaseRow}>
        {phases.map((p, idx) => (
          <View key={`${p.key}-${idx}`} style={styles.phase}>
            <MaterialCommunityIcons
              name={p.icon}
              size={16}
              color={colors.primary.blue700}
            />
            <Text style={styles.phaseValue}>{technique.pattern[p.key]}s</Text>
            <Text style={styles.phaseLabel}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
  },
  name: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  phase: {
    alignItems: 'center',
    gap: 2,
  },
  phaseValue: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  phaseLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
});
