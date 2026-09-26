import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../services/images/onboardingImageCache';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { ONBOARDING_VISUAL_MAX_WIDTH, scaleVisual } from './onboardingVisualScale';

/**
 * The flow's one big-picture beat: an illustration, a claim under it, and a
 * line explaining the claim. Every screen of this shape had its own copy of the
 * stage — three illustration sizes and three headline sizes between them — so
 * screens that were meant to read as the same kind of moment did not.
 *
 * A screen keeps its own words and its own footer. Everything about how the
 * block is drawn lives here.
 */

/** Square, and clamped so a tablet cannot run it past the content column. */
export const ONBOARDING_VISUAL_SIZE = Math.min(
  scaleVisual(290),
  ONBOARDING_VISUAL_MAX_WIDTH,
);

/** A cached illustration by key, or a drawn one sized to `ONBOARDING_VISUAL_SIZE`. */
type OnboardingVisual =
  | { image: OnboardingImageKey; illustration?: never }
  | { image?: never; illustration: ReactNode };

type OnboardingVisualIntroProps = OnboardingVisual & {
  /** a node, so a screen can emphasise part of its own claim */
  title: ReactNode;
  subtitle?: ReactNode;
  /** a quieter third line, for a detail the subtitle should not carry */
  footnote?: ReactNode;
};

export default function OnboardingVisualIntro({
  image,
  illustration,
  title,
  subtitle,
  footnote,
}: OnboardingVisualIntroProps) {
  return (
    <View style={styles.stage}>
      {image ? (
        <Image
          source={getOnboardingImageSource(image)}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          accessible={false}
        />
      ) : (
        <View style={styles.illustration}>{illustration}</View>
      )}

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </View>
    </View>
  );
}

/**
 * Colour alone cannot carry emphasis inside the title: `Text` seeds every
 * instance with `fonts.regular`, which beats inheritance from the title around
 * it, so a span naming only a colour renders a rung lighter than its
 * neighbours. Spans use this.
 */
export const onboardingVisualEmphasis = {
  fontFamily: fonts.semibold,
  color: colors.primary.blue500,
};

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  illustration: {
    width: ONBOARDING_VISUAL_SIZE,
    height: ONBOARDING_VISUAL_SIZE,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footnote: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
