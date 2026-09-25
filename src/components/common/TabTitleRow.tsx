import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from './Text';
import { colors } from '../../theme/colors';

interface TabTitleRowProps {
  title: string;
  action?: ReactNode;
  /** white title for a row sitting on a saturated colour block */
  onBlock?: boolean;
}

const TRAILING_ACTION_SIZE = 46;

/** The shared large-title rhythm for tab screens with a trailing action. */
export default function TabTitleRow({ title, action, onBlock = false }: TabTitleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, onBlock && styles.titleOnBlock]}>{title}</Text>
      {action == null ? null : <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TRAILING_ACTION_SIZE + spacing.lg,
    flexDirection: 'row',
    // Reserve the same space as a 46pt trailing control on every tab, so
    // titles sit at the original Profile and Explore position everywhere.
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  titleOnBlock: {
    color: colors.text.inverse,
  },
  action: { flexShrink: 0 },
});
