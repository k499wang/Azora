import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../../common/Text';
import { longFormStyles as styles } from './longFormStyles';

interface PaywallSectionProps {
  title: string;
  children: ReactNode;
}

export function PaywallSection({ title, children }: PaywallSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}
