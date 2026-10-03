import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '../common/Text';
import { useSaveTechniqueFeedbackMutation } from '../../queries/tracking/useSaveTechniqueFeedbackMutation';
import { useTechniqueFeedbackQuery } from '../../queries/tracking/useTechniqueFeedbackQuery';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Helpfulness } from '../../services/tracking/techniqueFeedbackService';

const OPTIONS: { value: Helpfulness; label: string }[] = [
  { value: 1, label: 'Not really' },
  { value: 2, label: 'A bit' },
  { value: 3, label: 'A lot' },
];

interface HelpfulnessQuestionProps {
  techniqueId: string;
  localDate: string;
  /** the one session being asked about — see `buildSessionKey` */
  sessionKey: string;
  /** the colour block it sits on; the card and selection come from its family */
  hue: { base: string; tint: string; ink: string };
  /** selects without saving, so a dev preview never steers recommendations */
  preview?: boolean;
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
  hue,
  preview = false,
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
    <View style={[styles.container, { backgroundColor: hue.tint }, style]}>
      <Text style={[styles.question, { color: hue.ink }]}>
        {selected == null ? 'Did this feel helpful today?' : 'Thanks — noted'}
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
                active && { backgroundColor: hue.base },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                triggerTapHaptic();
                setPending(option.value);
                if (preview) return;
                saveFeedback.mutate({
                  techniqueId,
                  localDate,
                  sessionKey,
                  helpfulness: option.value,
                });
              }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  { color: active ? colors.text.inverse : hue.ink },
                ]}
              >
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
    ...card.block,
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  question: {
    ...typography.title.title3,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    ...card.base,
    borderRadius: radius.medium,
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chipLabel: {
    ...typography.label.medium,
    textAlign: 'center',
  },
});
