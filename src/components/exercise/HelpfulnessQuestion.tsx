import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '../common/Text';
import { useSaveTechniqueFeedbackMutation } from '../../queries/tracking/useSaveTechniqueFeedbackMutation';
import { useTechniqueFeedbackQuery } from '../../queries/tracking/useTechniqueFeedbackQuery';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { Helpfulness } from '../../services/tracking/techniqueFeedbackService';

const OPTIONS: { value: Helpfulness; label: string }[] = [
  { value: 1, label: 'Not really' },
  { value: 2, label: 'A bit' },
  { value: 3, label: 'A lot' },
];

interface HelpfulnessQuestionProps {
  techniqueId: string;
  localDate: string;
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
  style,
}: HelpfulnessQuestionProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const feedback = useTechniqueFeedbackQuery(userId).data;
  const saveFeedback = useSaveTechniqueFeedbackMutation(userId);
  const [pending, setPending] = useState<Helpfulness | null>(null);

  const saved = feedback?.find(
    (row) => row.techniqueId === techniqueId && row.localDate === localDate,
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
                  helpfulness: option.value,
                });
              }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {option.label}
              </Text>
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
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    ...card.base,
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  chipActive: {
    backgroundColor: colors.primary.blue100,
    borderColor: colors.primary.blue600,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chipLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  chipLabelActive: {
    color: colors.primary.blue700,
  },
});
