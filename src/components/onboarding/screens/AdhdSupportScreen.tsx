import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import OnboardingOptionIcon, { type OnboardingOptionIconName } from '../OnboardingOptionIcon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import { scaleVisual } from '../onboardingVisualScale';

interface AdhdSupportScreenProps {
  cleaning?: boolean;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const BENEFITS: readonly { text: string; icon: OnboardingOptionIconName; color: string }[] = [
  { text: 'Focus on one thing at a time', icon: 'target', color: colors.playful.sky.base },
  { text: 'Structure your day so it feels organised', icon: 'calendar-check-outline', color: colors.playful.teal.base },
  { text: 'Finish what you start, one small step at a time', icon: 'streak', color: colors.playful.amber.base },
];

const CLEANING_BENEFITS: typeof BENEFITS = [
  { text: 'Focus on one spot at a time', icon: 'target', color: colors.playful.sky.base },
  { text: 'Turn chores into a simple routine', icon: 'calendar-check-outline', color: colors.playful.teal.base },
  { text: 'Finish each chore, one small step at a time', icon: 'streak', color: colors.playful.amber.base },
];

const BRAIN_WIDTH = scaleVisual(112);
/** the extracted scans are close to 7:8 */
const BRAIN_HEIGHT = BRAIN_WIDTH * (8 / 7);
/** the same glyph size the question rows use */
const BENEFIT_ICON_SIZE = 36;

export default function AdhdSupportScreen({
  cleaning = false,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AdhdSupportScreenProps) {
  return (
    <OnboardingScreenLayout
      title={
        cleaning
          ? 'Azora uses science to help people with ADHD keep life in order'
          : 'Azora uses science to help people with ADHD'
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.card}>
        <View style={styles.scans}>
          <View style={styles.scan}>
            <Image
              source={getOnboardingImageSource('brainScanBusy')}
              style={styles.brain}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
            />
            <Text style={styles.scanLabel}>Busy mind</Text>
          </View>
          <Icon name="arrow-right" size={scaleVisual(20)} color={colors.text.inverse} />
          <View style={styles.scan}>
            <Image
              source={getOnboardingImageSource('brainScanCalm')}
              style={styles.brain}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
            />
            <Text style={styles.scanLabel}>Calmer mind</Text>
          </View>
        </View>
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Azora can help ADHD</Text>
          {(cleaning ? CLEANING_BENEFITS : BENEFITS).map(({ text, icon, color }) => (
            <View key={text} style={styles.row}>
              <OnboardingOptionIcon name={icon} size={BENEFIT_ICON_SIZE} color={color} />
              <Text style={styles.benefit}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.outlined,
    overflow: 'hidden',
  },
  scans: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.playful.night.base,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  scan: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  brain: {
    width: BRAIN_WIDTH,
    height: BRAIN_HEIGHT,
  },
  scanLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  benefits: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  benefitsTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefit: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
});
