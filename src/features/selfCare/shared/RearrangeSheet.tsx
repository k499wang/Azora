import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import BottomSheet from '../../../components/common/BottomSheet';
import { Text } from '../../../components/common/Text';
import Icon, { type IconName } from '../../../components/common/icons/Icon';
import TaskCardBody, { taskCard } from '../../../components/home/journey/TaskCardBody';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { duration } from '../../../theme/motion';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import RoutineTaskIcon from '../RoutineTaskIcon';

const MOVE_BUTTON_SIZE = 36;
const MOVE_ICON_SIZE = 18;
const PILL_MIN_HEIGHT = 44;
const PILL_ICON_SIZE = 16;

export interface RearrangeItem {
  key: string;
  title: string;
  icon: IconName;
  detail: string;
}

interface RearrangeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** what is left, the step on screen first */
  items: readonly RearrangeItem[];
  /** `offset` counts from the step on screen */
  onMove: (offset: number, direction: -1 | 1) => void;
}

/** What is left of a step player, in the order it will run, with each step moved one place at a time. */
export default function RearrangeSheet({ visible, onClose, items, onMove }: RearrangeSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Rearrange"
      subtitle="What’s left, in the order you’ll do it."
    >
      <View style={styles.list}>
        {items.map((item, offset) => (
          <Animated.View
            key={item.key}
            layout={LinearTransition.duration(duration.base)}
            style={[taskCard.surface, taskCard.face]}
          >
            <TaskCardBody
              icon={<RoutineTaskIcon name={item.icon} />}
              badge={
                <View style={styles.moves}>
                  <MoveButton
                    icon="arrow-up"
                    accessibilityLabel={`Move ${item.title} earlier`}
                    disabled={offset === 0}
                    onPress={() => onMove(offset, -1)}
                  />
                  <MoveButton
                    icon="arrow-down"
                    accessibilityLabel={`Move ${item.title} later`}
                    disabled={offset === items.length - 1}
                    onPress={() => onMove(offset, 1)}
                  />
                </View>
              }
            >
              {offset === 0 ? <Text style={taskCard.overline}>NOW</Text> : null}
              <Text numberOfLines={2} style={taskCard.title}>{item.title}</Text>
              <Text style={taskCard.detail}>{item.detail}</Text>
            </TaskCardBody>
          </Animated.View>
        ))}
      </View>
    </BottomSheet>
  );
}

/** The pill that opens the sheet, above a player's "up next" card. */
export function RearrangePill({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Rearrange the steps left"
      hitSlop={spacing.xs}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Icon name="arrow-up" size={PILL_ICON_SIZE} color={colors.text.secondary} />
      <Icon name="arrow-down" size={PILL_ICON_SIZE} color={colors.text.secondary} />
      <Text style={styles.pillLabel}>Rearrange</Text>
    </Pressable>
  );
}

interface MoveButtonProps {
  icon: 'arrow-up' | 'arrow-down';
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}

function MoveButton({ icon, accessibilityLabel, disabled, onPress }: MoveButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.xs}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.moveButton, pressed && styles.pressed]}
    >
      <Icon
        name={icon}
        size={MOVE_ICON_SIZE}
        color={disabled ? colors.neutral[300] : colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  moves: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moveButton: {
    width: MOVE_BUTTON_SIZE,
    height: MOVE_BUTTON_SIZE,
    borderRadius: MOVE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  pill: {
    alignSelf: 'center',
    minHeight: PILL_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.lg,
  },
  pillLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
});
