import { StyleSheet, View } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/Icon';
import { radius } from '../../theme/card';
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
 * icon on a square of its own hue, so a list of to-dos reads as different
 * things at a glance. A finished line drops to neutral.
 */
export default function RoutineTaskIcon({ name, done = false }: RoutineTaskIconProps) {
  const hue = colors.playful[routineTaskHue(name)];
  return (
    <View style={[styles.badge, { backgroundColor: done ? colors.background.canvas : hue.soft }]}>
      <Icon name={name} size={GLYPH_SIZE} color={done ? colors.text.tertiary : hue.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
