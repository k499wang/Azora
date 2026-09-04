import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import {
  selfCareGoalDaypart,
  selfCareGoalDaypartTime,
  SELF_CARE_GOAL_DAYPARTS,
  SELF_CARE_GOAL_RECURRENCES,
  type SelfCareGoalRecurrence,
} from './domain/selfCareGoal';
import type { IconName } from '../../components/common/icons/paths';

const TILE_ICON_SIZE = 28;

/**
 * One choice inside an open field: an icon over its name. `wide` takes the
 * whole row on its own, which is where the odd one out at the end of a block
 * goes so the grid never ends on a half-empty line.
 */
function OptionTile({
  icon,
  label,
  selected,
  wide = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  selected: boolean;
  wide?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        wide ? styles.tileWide : styles.tileHalf,
        selected && styles.tileSelected,
        pressed && pressable.surface,
      ]}
    >
      <Icon
        name={icon}
        size={TILE_ICON_SIZE}
        color={selected ? colors.primary.blue600 : colors.text.secondary}
      />
      <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * When in the day a to-do belongs. Written once and shown in both places a
 * to-do is authored — the sheet it is added from and the sheet it is edited in
 * — so the hour is chosen the same way whichever one you came through.
 */
export function GoalTimeOptions({
  scheduledTime,
  onSelect,
}: {
  scheduledTime: string | null;
  onSelect: (scheduledTime: string | null) => void;
}) {
  const daypart = selfCareGoalDaypart(scheduledTime);

  return (
    <View style={styles.tiles}>
      {SELF_CARE_GOAL_DAYPARTS.map((part) => (
        <OptionTile
          key={part.id}
          icon={part.icon}
          label={part.label}
          selected={daypart === part.id}
          onPress={() => onSelect(selfCareGoalDaypartTime(part.id))}
        />
      ))}
      <OptionTile
        wide
        icon="clock"
        label="Any time"
        selected={scheduledTime == null}
        onPress={() => onSelect(null)}
      />
    </View>
  );
}

/** Which days a to-do comes back on. The other half of the same pair. */
export function GoalRepeatOptions({
  recurrence,
  onSelect,
}: {
  recurrence: SelfCareGoalRecurrence;
  onSelect: (recurrence: SelfCareGoalRecurrence) => void;
}) {
  return (
    <View style={styles.tiles}>
      {SELF_CARE_GOAL_RECURRENCES.map((option, index) => (
        <OptionTile
          key={option.id}
          icon={option.icon}
          label={option.label}
          selected={option.id === recurrence}
          wide={index === SELF_CARE_GOAL_RECURRENCES.length - 1}
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Outlined rather than filled: the tiles sit on the same white as the card
  // holding them, so the line is what separates a choice from its neighbours
  // and colour is left to mean "chosen".
  tile: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
  tileHalf: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  // Same button, full width. Only the basis changes, so the odd one out at the
  // end of a block is not a different control from the ones above it.
  tileWide: {
    flexGrow: 1,
    flexBasis: '100%',
  },
  tileSelected: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.background.accentSoft,
  },
  tileLabel: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  tileLabelSelected: {
    color: colors.primary.blue700,
  },
});
