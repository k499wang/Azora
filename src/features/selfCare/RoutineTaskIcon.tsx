import { StyleSheet, View } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { routineTaskHue } from './domain/routineTaskHue';

const BADGE_SIZE = 44;
const GLYPH_SIZE = 30;

interface RoutineTaskIconProps {
  name: IconName;
  done?: boolean;
}

/**
 * The consistent task mark used in routine pickers and My Routine cards: the
 * icon drawn in its own hue, so a list of to-dos reads as different
 * things at a glance. A finished line drops to neutral.
 */
export default function RoutineTaskIcon({ name, done = false }: RoutineTaskIconProps) {
  const hue = colors.playful[routineTaskHue(name)];
  return (
    <View style={styles.badge}>
      <Icon name={name} size={GLYPH_SIZE} color={done ? colors.text.tertiary : hue.base} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
