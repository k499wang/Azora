import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from './Text';
import { colors } from '../../theme/colors';

interface TabTitleRowProps {
  title: string;
  action?: ReactNode;
}

/** The shared large-title rhythm for tab screens with a trailing action. */
export default function TabTitleRow({ title, action }: TabTitleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action == null ? null : <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
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
  action: { flexShrink: 0 },
});
