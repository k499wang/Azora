import { Pressable, StyleSheet, View } from 'react-native';
import AnimatedSelectionToggle from '../../components/common/AnimatedSelectionToggle';
import { Text } from '../../components/common/Text';
import RoutineTaskIcon from '../selfCare/RoutineTaskIcon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { MoodAction } from './domain/moodActions';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface Props {
  actions: MoodAction[];
  selected: string[];
  disabled: boolean;
  onChange: (selected: string[]) => void;
}

export default function MoodActionPicker({
  actions,
  selected,
  disabled,
  onChange,
}: Props) {
  return (
    <View style={styles.list}>
      <Text style={styles.label}>Picked for how you’re feeling. Tap any to add to today.</Text>
      {actions.map((action) => {
        const isSelected = selected.includes(action.id);
        return (
          <Pressable
            key={action.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled }}
            accessibilityLabel={action.title}
            disabled={disabled}
            onPress={() => {
              triggerTapHaptic();
              onChange(
                isSelected
                  ? selected.filter((id) => id !== action.id)
                  : [...selected, action.id],
              );
            }}
            style={({ pressed }) => [
              card.base,
              card.shadow,
              styles.row,
              pressed && pressable.surface,
            ]}
          >
            <RoutineTaskIcon name={action.icon} />
            <Text style={styles.title}>{action.title}</Text>
            <AnimatedSelectionToggle selected={isSelected} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  title: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
});
