/**
 * One optional line, in the user's own words.
 *
 * On the same page as the tags rather than a page of its own. The tags answer
 * "what was going on" in taps and this answers it in words, so they are one
 * question; a page for a field most people will leave empty is a page most
 * people would have to dismiss.
 *
 * A single line, capped. The check-in is the thing that has to cost nothing,
 * and a box that invites paragraphs is a box people skip on the days they have
 * the least to give — which are the days worth hearing about.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../components/common/Text';
import { MOOD_NOTE_MAX_LENGTH } from './domain/moodCheckIn';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface MoodNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Return on the keyboard finishes the check-in, as Done would. */
  onSubmit: () => void;
}

export default function MoodNoteField({
  value,
  onChange,
  onSubmit,
}: MoodNoteFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Anything to add?</Text>
      <TextInput
        accessibilityLabel="A line about your day"
        autoCapitalize="sentences"
        maxLength={MOOD_NOTE_MAX_LENGTH}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Optional"
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="done"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  input: {
    ...typography.body.medium,
    color: colors.text.primary,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
