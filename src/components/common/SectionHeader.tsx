import { Text } from './Text';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon, { type IconName } from './icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Matches `title3`, so the icon reads as a letter in the heading. */
const ICON_SIZE = typography.title.title3.fontSize;

interface SectionHeaderProps {
  title: string;
  /** sits before the title, tinted to match it */
  icon?: IconName;
  right?: ReactNode;
}

export default function SectionHeader({
  title,
  icon,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        {icon == null ? null : (
          <Icon name={icon} size={ICON_SIZE} color={colors.text.primary} />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
