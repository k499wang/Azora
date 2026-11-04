import { Pressable, StyleSheet, View } from 'react-native';
import type { RoutineTemplate } from '../../data/routineLibrary';
import { routineSummary } from '../../data/routineShelves';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import Icon from '../common/icons/Icon';
import RoutineLibraryArt from './RoutineLibraryArt';

const ADDED_BADGE_SIZE = 28;

interface Props {
  routine: RoutineTemplate;
  added: boolean;
  onPress: () => void;
}

export default function RoutineShelfCard({ routine, added, onPress }: Props) {
  const label = `${routine.title}, ${routineSummary(routine)}${added ? ', added' : ''}`;
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens this routine"
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
        style={({ pressed }) => [styles.cover, card.shadow, pressed && pressable.subtle]}
      >
        <RoutineLibraryArt entry={routine} size="poster" />
      </Pressable>
      {added ? (
        <View style={styles.badge} pointerEvents="none">
          <Icon bold name="check" size={16} color={colors.text.inverse} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: ADDED_BADGE_SIZE,
    height: ADDED_BADGE_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue500,
  },
});
