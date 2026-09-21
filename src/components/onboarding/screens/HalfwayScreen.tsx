import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import AzoAside from '../AzoAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleControl } from '../onboardingVisualScale';

const GLYPH_SIZE = scaleControl(44);

interface HalfwayScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * The pause itself: the two facts are a pair, not a list. The first names what
 * the questions have been circling, the second answers it — so they read in
 * order and the second one's copy leans on the first.
 */
const FACTS = [
  {
    id: 'body',
    title: 'When there are too many things to do, tiny tasks can feel impossible',
    sub: 'It isn’t laziness. Your brain is holding too many open tabs.',
    icon: 'body-outline',
    hue: colors.playful.coral,
  },
  {
    id: 'reset',
    title: 'You don’t need to fix your whole life today',
    sub: 'One clear next step can make the pile feel smaller.',
    icon: 'refresh-circle-outline',
    hue: colors.playful.teal,
  },
] as const;

export default function HalfwayScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: HalfwayScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <AzoAside
          text="Halfway to your results!"
          variant="question"
          expression="happy"
          holding="notes"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <Text style={styles.heading}>Did you know?</Text>

        <View style={styles.card}>
          {FACTS.map((fact, index) => (
            <View
              key={fact.id}
              style={[styles.fact, index % 2 === 0 && styles.factFlipped]}
            >
              <Ionicons
                name={fact.icon}
                size={GLYPH_SIZE}
                color={fact.hue.base}
              />

              <View style={styles.factCopy}>
                <Text style={styles.factTitle}>{fact.title}</Text>
                <Text style={styles.factSub}>{fact.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  heading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  card: {
    ...card.base,
    ...card.shadow,
    backgroundColor: colors.background.card,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  // The pair alternates sides, so the card reads as two beats answering each
  // other rather than as a list of rows.
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  factFlipped: {
    flexDirection: 'row-reverse',
  },
  factCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  factTitle: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text.primary,
  },
  factSub: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
});
