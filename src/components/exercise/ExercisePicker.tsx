import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { BreathingTechnique } from '../../data/techniques';

function formatPattern(p: BreathingTechnique['pattern']) {
  return [p.inhale, p.holdIn, p.exhale, p.holdOut].filter((v) => v > 0).join('-');
}

interface ExercisePickerProps {
  techniques: BreathingTechnique[];
  selected: string;
  onSelect: (technique: BreathingTechnique) => void;
}

export default function ExercisePicker({ techniques, selected, onSelect }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const current = techniques.find((t) => t.id === selected) ?? techniques[0];

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.trigger} onPress={() => setOpen(!open)}>
        <View>
          <Text style={styles.triggerName}>{current.name}</Text>
          <Text style={styles.triggerPattern}>{formatPattern(current.pattern)}</Text>
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.text.secondary}
        />
      </Pressable>

      {open ? (
        <View style={styles.dropdown}>
          {techniques.map((t) => {
            const isSelected = t.id === selected;
            return (
              <Pressable
                key={t.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  onSelect(t);
                  setOpen(false);
                }}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                    {t.name}
                  </Text>
                  <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                    {t.description}
                  </Text>
                </View>
                <Text style={[styles.optionPattern, isSelected && styles.optionPatternSelected]}>
                  {formatPattern(t.pattern)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  triggerName: {
    ...typography.label.large,
    color: colors.text.primary,
  },
  triggerPattern: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.sm,
    backgroundColor: colors.background.elevated,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.xs,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: spacing.xs },
    shadowOpacity: 0.1,
    shadowRadius: spacing.sm + spacing.xs,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs / 2,
  },
  optionSelected: {
    backgroundColor: colors.primary.blue100,
  },
  optionContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionName: {
    ...typography.label.medium,
    color: colors.text.primary,
  },
  optionNameSelected: {
    color: colors.primary.blue700,
  },
  optionDesc: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
  },
  optionDescSelected: {
    color: colors.primary.blue500,
  },
  optionPattern: {
    ...typography.label.small,
    color: colors.text.tertiary,
  },
  optionPatternSelected: {
    color: colors.primary.blue600,
  },
});
