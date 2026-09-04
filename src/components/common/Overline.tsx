import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';

interface OverlineProps {
  /** written in sentence case; the style does the shouting */
  label: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The small caps label that names a group inside a section. Quieter than a
 * `SectionHeader` on purpose: it separates two kinds of row that share one
 * surface, rather than announcing a section of its own.
 */
export default function Overline({ label, style }: OverlineProps) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
