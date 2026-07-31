import { Text } from '../../../../components/common/Text';
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { fonts, typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { isShortScreen } from '../../../../theme/breakpoints';
import type { BreathingTechnique } from '../techniques';

interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
}

interface Props {
  technique: BreathingTechnique;
  textColors?: TextColors;
  topSlot?: ReactNode;
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

export default function TechniqueIntro({ technique, textColors, topSlot }: Props) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);
  const phases = PHASE_META.filter((p) => technique.pattern[p.key] > 0);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {topSlot ? <View style={styles.topSlot}>{topSlot}</View> : null}
      <View style={styles.phaseRow}>
        {phases.map((p, idx) => (
          <View key={`${p.key}-${idx}`} style={styles.phase}>
            <MaterialCommunityIcons
              name={p.icon}
              size={16}
              color={textColors ? textColors.accent : colors.primary.blue700}
            />
            <Text style={[styles.phaseValue, textColors && { color: textColors.primary }]}>
              {technique.pattern[p.key]}s
            </Text>
            <Text style={[styles.phaseLabel, textColors && { color: textColors.tertiary }]}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.name, textColors && { color: textColors.primary }]}>
        {technique.name}
      </Text>
      <Text
        style={[
          styles.description,
          compact && styles.descriptionCompact,
          textColors && { color: textColors.secondary },
        ]}
      >
        {technique.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
    transform: [{ translateY: -48 }],
  },
  // The intro is centred against the full screen while the rounds picker sits
  // in normal flow below it, so a long description grows straight into the
  // picker. Short screens lose that headroom entirely — tighten the block
  // rather than push it up, since the header caps how far it can travel.
  containerCompact: {
    gap: spacing.sm,
  },
  name: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body.large,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  descriptionCompact: {
    ...typography.body.small,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  topSlot: {
    alignItems: 'center',
    marginBottom: spacing.xs,
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
