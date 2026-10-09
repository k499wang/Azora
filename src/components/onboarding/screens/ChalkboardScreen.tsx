import type { ComponentType } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import BrainChalkboard from '../BrainChalkboard';
import CbtChalkboard from '../CbtChalkboard';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout, { onboardingTitleStyle } from '../OnboardingScreenLayout';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';

/** Azo teaching one idea at the chalkboard: a claim, the board, and the evidence under it. */

/**
 * Every lesson's title gets the room of the longest one, centred in it, so
 * the board lands in the same place on each screen whatever the title's length.
 */
const TITLE_LINES = 3;
const LESSONS = {
  cbtIntro: {
    title: 'Azora uses a CBT-based plan to help you get unstuck',
    explainer:
      'CBT (cognitive behavioral therapy) is one of the most studied methods for stress, anxiety, sleep, and focus.',
    Board: CbtChalkboard,
  },
  routineBrain: {
    title: 'Alongside CBT, we use GST to make your daily routine stick',
    explainer:
      'GST (Goal-Setting Theory) shows that clear, specific goals get better results than vague ones (Locke & Latham, 2002).',
    Board: BrainChalkboard,
  },
} satisfies Record<string, { title: string; explainer: string; Board: ComponentType<{ width: number }> }>;

export type ChalkboardLesson = keyof typeof LESSONS;

interface ChalkboardScreenProps {
  lesson: ChalkboardLesson;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function ChalkboardScreen({
  lesson,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ChalkboardScreenProps) {
  const { title, explainer, Board } = LESSONS[lesson];
  const { width: windowWidth } = useWindowDimensions();
  const boardWidth = Math.min(windowWidth - spacing.lg * 2, ONBOARDING_VISUAL_MAX_WIDTH);

  return (
    <OnboardingScreenLayout
      key={lesson}
      title=""
      titleSlot={
        <View style={styles.titleBox}>
          <Text
            style={onboardingTitleStyle}
            numberOfLines={TITLE_LINES}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        </View>
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <Board width={boardWidth} />
        <Text style={styles.explainer}>{explainer}</Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  titleBox: {
    height: onboardingTitleStyle.lineHeight * TITLE_LINES,
    justifyContent: 'center',
  },
  body: {
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  explainer: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
