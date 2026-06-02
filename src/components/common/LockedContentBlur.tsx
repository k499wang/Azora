import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { useGlassMode } from '../../hooks/useGlassMode';

interface LockedContentBlurProps {
  locked?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPressLocked?: () => void;
}

export default function LockedContentBlur({
  locked = false,
  children,
  style,
  onPressLocked,
}: LockedContentBlurProps) {
  const glassMode = useGlassMode();

  return (
    <View style={[styles.wrap, style]}>
      {children}
      {locked ? (
        <>
          {glassMode === 'solid' ? (
            <View
              style={[styles.bleedOverlay, styles.solidScrim]}
              pointerEvents="none"
            />
          ) : (
            <BlurView
              intensity={24}
              tint="light"
              style={styles.bleedOverlay}
              pointerEvents="none"
            />
          )}
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressLocked}
              style={styles.pressTarget}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'visible',
  },
  bleedOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    bottom: -5,
    left: -5,
  },
  solidScrim: {
    backgroundColor: colors.glass.scrim,
  },
  pressTarget: {
    ...StyleSheet.absoluteFillObject,
    top: -5,
    right: -5,
    bottom: -5,
    left: -5,
  },
});
