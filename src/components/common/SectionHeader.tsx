import { Text } from './Text';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';

interface SectionHeaderProps {
  title: string;
  right?: ReactNode;
}

export default function SectionHeader({ title, right }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
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
  title: {
    ...typography.title.title3,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.text.primary,
  },
});
