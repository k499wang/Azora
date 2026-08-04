import { Text } from './Text';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface CardTitleProps {
  title: string;
  leading?: ReactNode;
  right?: ReactNode;
  color?: string;
}

export default function CardTitle({
  title,
  leading,
  right,
  color = colors.text.primary,
}: CardTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <Text style={[styles.title, { color }]}>{title}</Text>
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
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 26,
  },
});
