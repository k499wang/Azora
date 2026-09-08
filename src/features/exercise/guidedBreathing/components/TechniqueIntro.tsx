import { Text } from '../../../../components/common/Text';
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../../theme/colors';
import { fonts, typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { breakpoints, isShortScreen } from '../../../../theme/breakpoints';
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
  roundsPicker: ReactNode;
}

export default function TechniqueIntro({ technique, textColors, roundsPicker }: Props) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
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
      <View style={styles.roundsPicker}>{roundsPicker}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // The layer around this centres it and already carries the screen margin,
    // so the block shrinks to its content — which on a tablet means the
    // description runs the full width of the window as one long line. The cap
    // is the same measure the scaffold's header and footer use, and no phone is
    // wide enough to reach it, so nothing below a tablet moves.
    maxWidth: breakpoints.contentMaxWidth,
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
    transform: [{ translateY: -72 }],
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
  roundsPicker: {
    alignItems: 'center',
    marginBottom: spacing.xs,
    transform: [{ translateY: spacing.sm }],
  },
});
