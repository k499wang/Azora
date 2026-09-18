import { Text } from './Text';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon, { type IconName } from './icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

/** Matches `title3`, so the icon reads as a letter in the heading. */
const ICON_SIZE = typography.title.title3.fontSize;

interface SectionHeaderProps {
  title: string;
  /** sits before the title, tinted to match it */
  icon?: IconName;
  /** `inverse` for a heading that sits on artwork rather than on the canvas */
  tone?: 'default' | 'inverse';
  /** a second line under the title, for what the section currently is */
  subtitle?: ReactNode;
  right?: ReactNode;
}

export default function SectionHeader({
  title,
  icon,
  tone = 'default',
  subtitle,
  right,
}: SectionHeaderProps) {
  const color =
    tone === 'inverse' ? colors.text.inverse : colors.text.primary;

  return (
    <View style={styles.headings}>
      {/* The right slot sits on the title's own line rather than beside the
          whole heading block: centred against a title *and* a subtitle, it
          lands between the two and reads as aligned to neither. */}
      <View style={styles.row}>
        <View style={styles.leading}>
          {icon == null ? null : (
            <Icon name={icon} size={ICON_SIZE} color={color} />
          )}
          <Text style={[styles.title, { color }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right}
      </View>
      {subtitle}
    </View>
  );
}

const styles = StyleSheet.create({
  headings: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
});
