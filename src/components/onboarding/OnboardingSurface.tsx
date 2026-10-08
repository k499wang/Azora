import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import AmbientBackground from '../common/AmbientBackground';

interface Props {
  children: ReactNode;
}

export default function OnboardingSurface({ children }: Props) {
  return (
    <View style={styles.root}>
      <AmbientBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
