import { Pressable, StyleSheet, View } from 'react-native';
import type { RoutineTemplate } from '../../data/routineLibrary';
import { routineSummary } from '../../data/routineShelves';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Text } from '../common/Text';
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
        style={({ pressed }) => [styles.content, pressed && pressable.subtle]}
      >
        <View style={[styles.cover, card.shadow]}>
          <RoutineLibraryArt entry={routine} size="poster" />
        </View>
        <Text numberOfLines={2} style={styles.facts}>{routineSummary(routine)}</Text>
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
  content: {
    gap: spacing.sm,
  },
  cover: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  facts: {
    ...typography.body.small,
    color: colors.text.secondary,
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
