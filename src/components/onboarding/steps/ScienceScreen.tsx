import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingStepProps } from '../types';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing, padding } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { card } from '../../../theme/card';

interface ProofItem {
  icon: IconName;
  title: string;
  body: string;
  tint: string;
}

const PROOF: ProofItem[] = [
  {
    icon: 'heart-rmssd',
    title: 'Measured by HRV',
    body: 'Heart-rate variability is the gold-standard biomarker for stress and recovery — the same signal used in clinical research.',
    tint: colors.primary.blue600,
  },
  {
    icon: 'breath-wave',
    title: 'Backed by breathwork science',
    body: 'Slow, paced breathing at ~6 bpm is shown to activate the vagus nerve and shift you into parasympathetic recovery.',
    tint: colors.orange[500],
  },
  {
    icon: 'breath-hold',
    title: 'Built on validated protocols',
    body: 'Box breathing, 4-7-8, and resonance breathing — protocols used by Navy SEALs, athletes, and clinicians.',
    tint: colors.success[500],
  },
];

export function ScienceScreen({ onNext }: OnboardingStepProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Why it works</Text>
        <Text style={styles.title}>Calm you can measure.</Text>
        <Text style={styles.subtitle}>
          Azora pairs proven breath protocols with real-time heart-rate data — so you see your
          nervous system change, not just feel it.
        </Text>

        <View style={styles.cards}>
          {PROOF.map((item) => (
            <View key={item.title} style={[card.base, card.shadow, styles.card]}>
              <View style={[styles.iconBubble, { backgroundColor: `${item.tint}1A` }]}>
                <Icon name={item.icon} size={26} color={item.tint} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Trusted by athletes, clinicians, and high-stress professionals.
          </Text>
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: padding.screen.horizontal,
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.text.brand,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  cardBody: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  badge: {
    marginTop: spacing.xl,
    backgroundColor: colors.background.accentSoft,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.label.small,
    color: colors.text.brand,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
