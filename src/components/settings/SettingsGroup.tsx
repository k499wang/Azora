import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { card } from '../../theme/card';

interface SettingsGroupProps {
  children: ReactNode;
}

export default function SettingsGroup({ children }: SettingsGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: {
    ...card.base,
    ...card.shadow,
    overflow: 'hidden',
  },
});
