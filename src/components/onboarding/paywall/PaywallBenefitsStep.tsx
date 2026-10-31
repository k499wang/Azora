import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import TaskIllustration from '../../common/icons/TaskIllustration';
import { planNounForIntent } from '../../../lib/paywallPlanHighlights';
import type { OnboardingIntent } from '../types';
import { scaleVisual } from '../onboardingVisualScale';
import { paywallStepStyles as styles } from './paywallStepStyles';
import HarvardLogo from '../../../../assets/logos/harvard.svg';
import StanfordLogo from '../../../../assets/logos/stanford.svg';

const AZO_HEART = require('../../../../assets/mascot/azo-heart.png');

const AZO_WIDTH_SHARE = 0.43;
const AZO_MAX = scaleVisual(160);
const HARVARD_LOGO_HEIGHT = scaleVisual(60);
const STANFORD_LOGO_HEIGHT = scaleVisual(42);

type BenefitIcon = ComponentProps<typeof TaskIllustration>['name'];

const BENEFIT_ICONS: BenefitIcon[] = ['calendar', 'todo-plan', 'heart'];

/** Two short outcomes per goal, after the shared "built from your answers" line. */
const GOAL_BENEFITS: Partial<Record<OnboardingIntent, [string, string]>> = {
  scrolling: ['Pause before the automatic scroll', 'Make more room for what you choose'],
  burnout: ['Small steps that fit your energy', 'Build rest into your day'],
  procrastination: ['Make your first step clear and small', 'Practise beginning before motivation arrives'],
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

const DEFAULT_TITLE = 'Build a life that feels better with Azora.';
const CLEANING_TITLE = 'Build a better home life with Azora.';

interface PaywallBenefitsStepProps {
  intent?: OnboardingIntent;
  /** False when the plan has no trial, so "for free" is never an empty claim. */
  hasTrial: boolean;
  /** Offering-supplied headline for trial users; `{plan}` is replaced with the goal noun. */
  remoteTitle?: string | null;
  stakesBenefit?: string | null;
}

interface BrandedTitleProps {
  text: string;
}

/** The headline with each "Azora" in the brand colour. */
function BrandedTitle({ text }: BrandedTitleProps) {
  return text.split(/(Azora\.?)/).map((part, index) =>
    part.startsWith('Azora') ? (
      <Text key={index} style={styles.stepTitleBrand}>{part}</Text>
    ) : (
      part
    ),
  );
}

export function PaywallBenefitsStep({
  intent,
  hasTrial,
  remoteTitle,
  stakesBenefit,
}: PaywallBenefitsStepProps) {
  const title = hasTrial && remoteTitle?.trim()
    ? remoteTitle.trim().replaceAll('{plan}', planNounForIntent(intent))
    : intent === 'cleaning' ? CLEANING_TITLE : DEFAULT_TITLE;
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
          <BrandedTitle text={title} />
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
      <View style={styles.benefitsProof}>
        <Text style={styles.benefitsReassurance}>Backed by research from</Text>
        <View style={styles.benefitsLogos}>
          <HarvardLogo
            width={HARVARD_LOGO_HEIGHT * (600 / 165)}
            height={HARVARD_LOGO_HEIGHT}
            viewBox="0 0 600 165"
          />
          <StanfordLogo
            width={STANFORD_LOGO_HEIGHT * (640 / 134.11)}
            height={STANFORD_LOGO_HEIGHT}
            viewBox="0 0 640 134.11"
          />
        </View>
      </View>
    </View>
  );
}

export default PaywallBenefitsStep;
