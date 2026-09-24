import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import { card, softColoredCard } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import { scaleVisual } from '../onboardingVisualScale';
import ConfusedKoala from '../../../../assets/Poses/koala_pose_confused.svg';
import CelebratingKoala from '../../../../assets/Poses/koala_pose_celebrating.svg';
import { IMPROVED_HABITS_PERCENT } from '../../../data/socialProof';

interface BeforeAfterScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const BEFORE = [
  'A scattered day',
  'Unfinished goals',
  'Habits that don’t stick',
  'Running on empty',
];

const AFTER = [
  'A day with a plan',
  'Goals you finish',
  'Habits that stick',
  'Energy that lasts',
];

const KOALA_WIDTH = scaleVisual(110);
/** the pose artwork is drawn on a 1080 × 1200 board */
const KOALA_HEIGHT = KOALA_WIDTH * (1200 / 1080);
/** how far the two cards step past each other, so they read as a before and an after */
const STAGGER = spacing['2xl'];

const beforeHue = colors.playful.violet;

interface ComparisonCardProps {
  label: string;
  items: string[];
  icon: 'close' | 'check';
  tone: 'before' | 'after';
  children: React.ReactNode;
}

function ComparisonCard({ label, items, icon, tone, children }: ComparisonCardProps) {
  const isBefore = tone === 'before';
  const inkColor = isBefore ? beforeHue.ink : colors.text.primary;
  const iconColor = isBefore ? beforeHue.base : colors.playful.teal.base;

  return (
    <View style={[styles.card, isBefore ? styles.beforeCard : styles.afterCard]}>
      <Text style={[styles.label, { color: inkColor }]}>{label}</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item} style={styles.row}>
            <MaterialCommunityIcons
              name={icon}
              size={scaleVisual(18)}
              color={iconColor}
              style={styles.rowIcon}
            />
            <Text style={[styles.item, { color: inkColor }]}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.koala}>{children}</View>
    </View>
  );
}

export default function BeforeAfterScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BeforeAfterScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Become the best version of yourself with Azora."
      subtitle="We turn your biggest goals into simple daily actions with a CBT-based plan."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <View style={styles.cards}>
          <ComparisonCard label="Before" items={BEFORE} icon="close" tone="before">
            <ConfusedKoala width={KOALA_WIDTH} height={KOALA_HEIGHT} />
          </ComparisonCard>
          <ComparisonCard label="After" items={AFTER} icon="check" tone="after">
            <CelebratingKoala width={KOALA_WIDTH} height={KOALA_HEIGHT} />
          </ComparisonCard>
        </View>
        <Text style={styles.proof}>
          <Text style={styles.proofEmphasis}>{IMPROVED_HABITS_PERCENT}%</Text> of Azora
          users report approaching their habits better.
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  cards: {
    flexDirection: 'row',
  },
  card: {
    ...card.base,
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  beforeCard: {
    ...softColoredCard(beforeHue),
    marginTop: STAGGER,
  },
  afterCard: {
    ...card.shadow,
    marginBottom: STAGGER,
    marginLeft: -spacing.sm,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  rowIcon: {
    marginTop: 1,
  },
  item: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  koala: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  proof: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  proofEmphasis: {
    fontFamily: fonts.semibold,
    color: colors.playful.teal.ink,
  },
});
