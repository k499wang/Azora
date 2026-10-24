import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HarvardLogo from '../../../assets/logos/harvard.svg';
import StanfordLogo from '../../../assets/logos/stanford.svg';
import ChunkyButton from '../common/ChunkyButton';
import ConfettiFall from '../common/ConfettiFall';
import { LoopingTwinkle } from '../common/RewardSparkles';
import TaskIllustration from '../common/icons/TaskIllustration';
import { Land, RiseUnlessReducedMotion } from '../common/Reveal';
import ScreenContent from '../common/ScreenContent';
import { Text } from '../common/Text';
import type { OnboardingIntent } from '../onboarding/types';
import { REWARD_BEAT } from '../../features/plan/rewardEntrance';
import { useCompletionHaptic } from '../../hooks/useCompletionHaptic';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

type IllustrationName = Parameters<typeof TaskIllustration>[0]['name'];

const HERO_STAGE_WIDTH = 220;
const HERO_STAGE_HEIGHT = 150;
const HERO_TILE = 120;
const HERO_ART = 84;
const ROW_ART = 36;
const CONFETTI_PIECES = 60;
const CONFETTI_MS = 4_500;
const HARVARD_LOGO_HEIGHT = 40;
const STANFORD_LOGO_HEIGHT = 28;

/** Stars around the hero, in pixels of its stage. */
const TWINKLES = [
  { x: 32, y: 34, size: 18, color: colors.reward.gold, period: 1_500 },
  { x: 190, y: 26, size: 14, color: colors.playful.sky.mid, period: 1_900 },
  { x: 204, y: 104, size: 18, color: colors.reward.gold, period: 1_700 },
  { x: 18, y: 112, size: 13, color: colors.playful.sky.mid, period: 2_100 },
];

interface IncludedRow {
  art: IllustrationName;
  title: string;
  detail: string;
}

const INCLUDED: IncludedRow[] = [
  { art: 'todo-plan', title: 'Your Personalized Plan', detail: 'Built from your answers, one day at a time' },
  { art: 'breath-wave', title: 'Guided exercises', detail: 'For the moments that feel heavy' },
  { art: 'book', title: 'Short lessons', detail: 'Why your mind does what it does' },
];

const PLAN_GOALS: Partial<Record<OnboardingIntent, string>> = {
  scrolling: 'get your time back',
  burnout: 'make space to recharge',
  procrastination: 'turn “later” into progress',
  stress_relief: 'find calm when life gets loud',
  calm_fast: 'step out of the worry loop',
  sleep: 'reclaim your evenings',
  focus: 'give your attention to what matters',
  cleaning: 'feel at home in your space',
};

interface Props {
  /** What they came for, as a verb phrase ("handle stress and overwhelm"); null when unknown. */
  goalPhrase: string | null;
  intent?: OnboardingIntent;
  isContinuing: boolean;
  errorMessage?: string | null;
  onContinue: () => void;
}

/**
 * Shown once after a new purchase to celebrate their goal, show what they now
 * have, and offer one next step.
 */
export default function ProWelcome({ goalPhrase, intent, isContinuing, errorMessage, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const headlineGoal = (intent == null ? undefined : PLAN_GOALS[intent]) ?? goalPhrase;
  useCompletionSound('activity', { autoPlay: true });
  useCompletionHaptic('activity', true);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent style={styles.column}>
          <View style={styles.heroStage}>
            <RiseUnlessReducedMotion delay={REWARD_BEAT.hero} reducedMotion={reducedMotion} style={styles.hero}>
              <TaskIllustration name="celebration" size={HERO_ART} />
            </RiseUnlessReducedMotion>
            {TWINKLES.map((twinkle, index) => (
              <LoopingTwinkle
                key={index}
                x={twinkle.x}
                y={twinkle.y}
                size={twinkle.size}
                color={twinkle.color}
                delay={REWARD_BEAT.title + index * 120}
                period={twinkle.period}
                active
                reducedMotion={reducedMotion}
              />
            ))}
          </View>
          <RiseUnlessReducedMotion delay={REWARD_BEAT.title} reducedMotion={reducedMotion}>
            <Text style={styles.title}>
              {headlineGoal == null ? (
                'Today, things start to change.'
              ) : (
                <>
                  Today, you start to <Text style={styles.titleGoal}>{headlineGoal}</Text>.
                </>
              )}
            </Text>
          </RiseUnlessReducedMotion>
          <RiseUnlessReducedMotion delay={REWARD_BEAT.cards} reducedMotion={reducedMotion} style={styles.section}>
            <Text style={styles.sectionTitle}>What you get</Text>
            <View style={styles.card}>
              {INCLUDED.map((row) => (
                <View key={row.art} style={styles.row}>
                  <View style={card.taskIcon}>
                    <TaskIllustration name={row.art} size={ROW_ART} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowDetail}>{row.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </RiseUnlessReducedMotion>

          <RiseUnlessReducedMotion delay={REWARD_BEAT.cards} reducedMotion={reducedMotion} style={styles.section}>
            <View style={styles.proof}>
              <Text style={styles.proofLabel}>Backed by research from</Text>
              <View style={styles.logos}>
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
          </RiseUnlessReducedMotion>
        </ScreenContent>
      </ScrollView>
      <ConfettiFall
        count={CONFETTI_PIECES}
        durationMs={CONFETTI_MS}
        spread={1}
        startTop={0}
        fallDistance={windowHeight + 80}
      />

      <ScreenContent style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
        <Land delay={REWARD_BEAT.cta}>
          <ChunkyButton label="Start Day 1" shape="card" loading={isContinuing} onPress={onContinue} />
        </Land>
      </ScreenContent>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  column: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  heroStage: {
    alignSelf: 'center',
    width: HERO_STAGE_WIDTH,
    height: HERO_STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    width: HERO_TILE,
    height: HERO_TILE,
    borderRadius: HERO_TILE / 2,
    backgroundColor: colors.playful.amber.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  // The app's Text sets its own default font, so a nested span restates the title's.
  titleGoal: {
    ...typography.title.title1,
    color: colors.text.brand,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  rowDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  proof: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  proofLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  logos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  footer: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
