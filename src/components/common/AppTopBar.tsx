import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/spacing';

const TOP_BAR_HEIGHT = 58;

interface AppTopBarProps {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export default function AppTopBar({ leftSlot, rightSlot }: AppTopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>{leftSlot}</View>
      <View style={styles.side}>{rightSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TOP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  side: {},
});
