import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const DOT_SIZE = 7;

interface PagerDotsProps {
  /** drawn on a saturated field rather than the app's canvas */
  onField?: boolean;
  count: number;
  index: number;
}

/** Says "there are more of these, sideways", and which one you are on. */
export default function PagerDots({
  count,
  index,
  onField = false,
}: PagerDotsProps) {
  if (count <= 1) {
    return null;
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, dot) => (
        <View
          key={dot}
          style={[
            styles.dot,
            onField && styles.dotOnField,
            dot === index && (onField ? styles.activeOnField : styles.active),
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.border.default,
  },
  active: {
    backgroundColor: colors.primary.blue500,
  },
  dotOnField: {
    backgroundColor: colors.onBlock.textMuted,
  },
  activeOnField: {
    backgroundColor: colors.text.inverse,
  },
});
