import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleVisual } from '../onboardingVisualScale';

interface SleepInsightScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const KOALA_WIDTH = scaleVisual(290);
const KOALA_HEIGHT = KOALA_WIDTH;

export default function SleepInsightScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: SleepInsightScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <Image
          source={getOnboardingImageSource('azoSleeping')}
          style={styles.koala}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
        />

        <View style={styles.copy}>
          <Text style={styles.headline}>
            <Text style={styles.headlineEmphasis}>58%</Text> of people struggle
            with <Text style={styles.headlineEmphasis}>quality sleep</Text>.
          </Text>
          <Text style={styles.sub}>
            We’ll guide you into a calming bedtime routine, so winding down
            happens on its own and mornings start easier.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['2xl'],
  },
  koala: {
    width: KOALA_WIDTH,
    height: KOALA_HEIGHT,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Colour alone carries the emphasis, so the face has to be restated: `Text`
  // seeds every instance with `fonts.regular`, which beats inheritance from the
  // headline around it. A span that names only a colour renders a rung lighter
  // than the words either side of it.
  headlineEmphasis: {
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
  },
  sub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
