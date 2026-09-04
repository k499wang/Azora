import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { GOAL_ICON_CHOICES } from './goalSuggestions';

const TILE_SIZE = 60;
const TILE_ICON_SIZE = 28;

interface GoalIconPickerProps {
  selected: IconName;
  onSelect: (icon: IconName) => void;
  /** the tile colours, since the picker is shown on both a colour block and a card */
  tone?: 'onBlock' | 'onCard';
}

/** The shelf of icons a to-do can wear, shared by writing one and editing one. */
export default function GoalIconPicker({
  selected,
  onSelect,
  tone = 'onBlock',
}: GoalIconPickerProps) {
  const onCard = tone === 'onCard';

  return (
    <View style={styles.grid}>
      {GOAL_ICON_CHOICES.map((choice) => {
        const isSelected = choice === selected;
        return (
          <Pressable
            key={choice}
            accessibilityRole="button"
            accessibilityLabel={choice}
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              triggerTapHaptic();
              onSelect(choice);
            }}
            style={({ pressed }) => [
              styles.tile,
              onCard ? styles.tileOnCard : styles.tileOnBlock,
              isSelected &&
                (onCard ? styles.selectedOnCard : styles.selectedOnBlock),
              pressed && pressable.surface,
            ]}
          >
            <Icon
              name={choice}
              size={TILE_ICON_SIZE}
              color={onCard ? colors.primary.blue600 : colors.text.inverse}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOnBlock: {
    backgroundColor: colors.onBlock.fill,
  },
  tileOnCard: {
    backgroundColor: colors.background.cardSoft,
  },
  selectedOnBlock: {
    backgroundColor: colors.onBlock.fillActive,
  },
  selectedOnCard: {
    backgroundColor: colors.background.accentSoft,
  },
});
