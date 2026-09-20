import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

/**
 * One rhythm for the whole sell page: a heading, then the block it belongs to,
 * so the sections read as one page being scrolled rather than screens stitched
 * together.
 */
export const longFormStyles = StyleSheet.create({
  section: {
    gap: spacing.md,
    paddingTop: spacing['2xl'],
  },
  title: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
