import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface CardTitleProps {
  title: string;
  leading?: ReactNode;
  right?: ReactNode;
}

export default function CardTitle({ title, leading, right }: CardTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
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
    ...typography.heading.heading2,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
});
