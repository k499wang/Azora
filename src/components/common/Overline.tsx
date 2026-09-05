import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface OverlineProps {
  /** written in sentence case; the style does the shouting */
  label: string;
  /** how far through the group you are, shown at the end of the label line */
  done?: number;
  total?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The small caps label that names a group inside a section. Quieter than a
 * `SectionHeader` on purpose: it separates two kinds of row that share one
 * surface, rather than announcing a section of its own.
 */
export default function Overline({ label, done, total, style }: OverlineProps) {
  const showsCount = done != null && total != null && total > 0;

  return (
    <View style={[styles.row, style]}>
      <Text style={styles.label}>{label}</Text>
      {showsCount ? (
        <Text
          style={styles.count}
          accessibilityLabel={`${done} of ${total} done`}
        >
          {done}/{total} done
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  // The overline token's own size is a caption; a group label has to hold a
  // block of rows under it, so it is carried up to label size and given the
  // section heading's weight while keeping the token's tracking and casing.
  label: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.2,
    color: colors.text.secondary,
  },
  // Quieter than the label it trails: progress, not a second heading.
  count: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    color: colors.text.tertiary,
  },
});
