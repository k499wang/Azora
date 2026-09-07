import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '../common/Text';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from '../onboarding/OnboardingOptionIcon';
import { useSaveTechniqueFeedbackMutation } from '../../queries/tracking/useSaveTechniqueFeedbackMutation';
import { useTechniqueFeedbackQuery } from '../../queries/tracking/useTechniqueFeedbackQuery';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Helpfulness } from '../../services/tracking/techniqueFeedbackService';

const FACE_SIZE = 44;

const OPTIONS: {
  value: Helpfulness;
  label: string;
  icon: OnboardingOptionIconName;
  accent: string;
}[] = [
  {
    value: 1,
    label: 'Not really',
    icon: 'emoticon-confused-outline',
    accent: colors.playful.coral.base,
  },
  {
    value: 2,
    label: 'A bit',
    icon: 'emoticon-neutral-outline',
    accent: colors.playful.amber.base,
  },
  {
    value: 3,
    label: 'A lot',
    icon: 'emoticon-excited-outline',
    accent: colors.playful.sky.base,
  },
];

interface HelpfulnessQuestionProps {
  techniqueId: string;
  localDate: string;
  /** the one session being asked about — see `buildSessionKey` */
  sessionKey: string;
  style?: ViewStyle;
}

/**
 * One tap, no confirm, no undo prompt.
 *
 * The answer steers which exercise gets recommended, which is the only reason
 * it is worth asking — a feedback prompt that stores nothing reads as theatre by
 * about the fourth session.
 */
export default function HelpfulnessQuestion({
  techniqueId,
  localDate,
  sessionKey,
  style,
}: HelpfulnessQuestionProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const feedback = useTechniqueFeedbackQuery(userId).data;
  const saveFeedback = useSaveTechniqueFeedbackMutation(userId);
  const [pending, setPending] = useState<Helpfulness | null>(null);

  // Scoped to this session, so redoing an exercise asks again rather than
  // showing back the answer given the last time.
  const saved = feedback?.find(
    (row) => row.sessionKey === sessionKey,
  )?.helpfulness;
  const selected = pending ?? saved ?? null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.question}>
        {selected == null ? 'Did this feel helpful?' : 'Thanks — noted'}
      </Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const active = selected === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${option.label}${active ? ', selected' : ''}`}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                triggerTapHaptic();
                setPending(option.value);
                saveFeedback.mutate({
                  techniqueId,
                  localDate,
                  sessionKey,
                  helpfulness: option.value,
                });
              }}
            >
              <View style={styles.face}>
                <OnboardingOptionIcon
                  name={option.icon}
                  size={FACE_SIZE}
                  color={option.accent}
                />
              </View>
              <Text style={styles.chipLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  question: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    ...card.base,
    flex: 1,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  face: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary.blue100,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chipLabel: {
    ...typography.label.medium,
    color: colors.neutral[900],
    textAlign: 'center',
  },
});
