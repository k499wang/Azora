import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import LaurelFrame from './LaurelFrame';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface Props {
  value: string;
  label: string;
  /** `lg` is the headline claim; `sm` is supporting proof stacked above it. */
  scale?: 'sm' | 'lg';
  size?: number;
  /** Sits beside the value — a rating's star, not decoration. */
  icon?: ReactNode;
}

export default function LaurelStat({
  value,
  label,
  scale = 'lg',
  size,
  icon,
}: Props) {
  const large = scale === 'lg';

  return (
    <LaurelFrame size={size}>
      <View style={styles.stack}>
        <View style={styles.valueRow}>
          <Text style={large ? styles.valueLarge : styles.valueSmall}>{value}</Text>
          {icon}
        </View>
        <Text style={large ? styles.labelLarge : styles.labelSmall}>{label}</Text>
      </View>
    </LaurelFrame>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  valueLarge: {
    ...typography.display.display1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  valueSmall: {
    ...typography.display.display3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  labelLarge: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  labelSmall: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
