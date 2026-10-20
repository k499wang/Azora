import { Pressable, StyleSheet, View } from 'react-native';
import { ROUTINE_TEMPLATES, type RoutineTemplate } from '../../data/routineLibrary';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import RoutineLibraryArt from './RoutineLibraryArt';

interface Props {
  onOpenRoutine: (entry: RoutineTemplate) => void;
}

export default function RoutineCoverGrid({ onOpenRoutine }: Props) {
  return (
    <View style={styles.grid}>
      {ROUTINE_TEMPLATES.map((entry) => (
        <Pressable
          key={entry.id}
          accessibilityRole="button"
          accessibilityLabel={entry.title}
          accessibilityHint="Opens this routine"
          onPress={() => {
            triggerTapHaptic();
            onOpenRoutine(entry);
          }}
          style={({ pressed }) => [styles.tile, card.shadow, pressed && pressable.subtle]}
        >
          <RoutineLibraryArt entry={entry} size="poster" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.lg,
  },
  tile: {
    width: '48%',
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
});
