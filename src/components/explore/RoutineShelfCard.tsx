import { Pressable, StyleSheet, View } from 'react-native';
import type { RoutineTemplate } from '../../data/routineLibrary';
import { routineFacts } from '../../data/routineShelves';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import RoutineLibraryArt from './RoutineLibraryArt';

const ADDED_BADGE_SIZE = 28;
const FACT_ICON_SIZE = 16;

interface Props {
  routine: RoutineTemplate;
  added: boolean;
  onPress: () => void;
}

export default function RoutineShelfCard({ routine, added, onPress }: Props) {
  const { minutes, repeat } = routineFacts(routine);
  const label = `${routine.title}, ${minutes}, ${repeat}${added ? ', added' : ''}`;
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
        <View style={styles.facts}>
          <View style={styles.fact}>
            <Icon name="timer" size={FACT_ICON_SIZE} color={colors.text.secondary} />
            <Text numberOfLines={1} style={styles.factText}>{minutes}</Text>
          </View>
          <View style={styles.fact}>
            <Icon name="repeat" size={FACT_ICON_SIZE} color={colors.text.secondary} />
            <Text numberOfLines={1} style={styles.factText}>{repeat}</Text>
          </View>
        </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  factText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
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
