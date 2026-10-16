import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import LaurelStat from '../../common/LaurelStat';
import Icon from '../../common/icons/Icon';
import TaskIllustration from '../../common/icons/TaskIllustration';
import { colors } from '../../../theme/colors';
import type { OnboardingIntent } from '../types';
import { scaleVisual } from '../onboardingVisualScale';
import { paywallStepStyles as styles } from './paywallStepStyles';

const AZO_HEART = require('../../../../assets/mascot/azo-heart.png');

const AZO_WIDTH_SHARE = 0.43;
const AZO_MAX = scaleVisual(160);

type BenefitIcon = ComponentProps<typeof TaskIllustration>['name'];

const BENEFIT_ICONS: BenefitIcon[] = ['calendar', 'todo-plan', 'heart'];

/** Two short outcomes per goal, after the shared "built from your answers" line. */
const GOAL_BENEFITS: Partial<Record<OnboardingIntent, [string, string]>> = {
  stress_relief: ['Calm down in just 5 minutes a day', 'Feel steadier when days get hard'],
  calm_fast: ['Step out of worry loops sooner', 'Feel calmer, faster, wherever you are'],
  sleep: ['Wind down in 5 minutes before bed', 'Fall asleep more easily each night'],
  focus: ['Get started without the usual struggle', 'Stay on task for longer stretches'],
  energy: ['Small daily boosts that really add up', 'Feel more awake through the day'],
  self_acceptance: ['Quiet your inner critic, bit by bit', 'Be kinder to yourself every day'],
  emotional_balance: ['Pause before you react in the moment', 'Feel more even from day to day'],
  self_care: ['Self-care that fits into your day', 'Feel looked after again, every day'],
  spiritual: ['A daily moment of stillness for you', 'Feel more connected and grounded'],
  yoga: ['Breathe better and deeper on the mat', 'Short practices for every day'],
  heart_health: ['Watch your heart rate settle in real time', 'Recover better, day by day'],
  daily_habit: ['Build habits that actually stick', 'Keep your streak going with Azo'],
  cleaning: ['Get started even when it feels like too much', 'A calmer, tidier home, bit by bit'],
};
const DEFAULT_BENEFITS: [string, string] = ['Build habits that actually stick', 'Feel a little better every day'];

interface PaywallBenefitsStepProps {
  intent?: OnboardingIntent;
  /** False when the plan has no trial, so "for free" is never an empty claim. */
  hasTrial: boolean;
  stakesBenefit?: string | null;
}

export function PaywallBenefitsStep({
  intent,
  hasTrial,
  stakesBenefit,
}: PaywallBenefitsStepProps) {
  const benefits = [
    stakesBenefit ?? 'A daily plan built from your answers to fit your life',
    ...((intent != null ? GOAL_BENEFITS[intent] : undefined) ?? DEFAULT_BENEFITS),
  ];
  const { width } = useWindowDimensions();
  const azoSize = Math.min(AZO_MAX, Math.round(width * AZO_WIDTH_SHARE));

  return (
    <View style={styles.benefitsStepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {hasTrial ? (
            <>
              Build a life that feels better with{' '}
              <Text style={styles.stepTitleBrand}>Azora.</Text>
            </>
          ) : (
            <>
              Everything in{' '}
              <Text style={styles.stepTitleBrand}>Azora.</Text>
            </>
          )}
        </Text>
      </View>

      <View style={styles.benefitsArtWrap}>
        <Image
          source={AZO_HEART}
          style={{ width: azoSize, height: azoSize }}
          contentFit="contain"
          accessible={false}
        />
      </View>
      <View style={styles.benefitsList}>
        {benefits.map((title, index) => (
          <View key={title} style={styles.benefitsRow}>
            <View style={styles.benefitsIcon}>
              <TaskIllustration name={BENEFIT_ICONS[index]} size={scaleVisual(44)} />
            </View>
            <Text style={styles.benefitsTitle}>{title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.benefitsExpert}>
        <Icon name="shield-check" size={scaleVisual(20)} color={colors.success[500]} />
        <Text style={styles.benefitsExpertText}>Built on CBT, reviewed by a clinical psychologist</Text>
      </View>
      <View style={styles.benefitsRating}>
        <LaurelStat scale="sm" value="Top rated" label="on the App Store" size={scaleVisual(52)} />
        <View style={styles.benefitsStars}>
          {Array.from({ length: 5 }, (_, index) => (
            <Icon key={index} name="star" size={scaleVisual(24)} color={colors.reward.gold} />
          ))}
        </View>
        <Text style={styles.benefitsReassurance}>No commitment, cancel anytime.</Text>
      </View>
    </View>
  );
}

export default PaywallBenefitsStep;
