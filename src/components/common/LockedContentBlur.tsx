import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LockedScrim from './LockedScrim';
import { colors } from '../../theme/colors';

// Alpha suffixes on the surface hex: the frost tint, and the fully clear stop
// the edge feather resolves to.
const FROST_ALPHA = '59';
const CLEAR_ALPHA = '00';

interface LockedContentBlurProps {
  locked?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPressLocked?: () => void;
  /**
   * Solid 6-digit hex of the surface behind this content. The frost is tinted
   * with it and feathers out into it, so the gate has no hard rectangle edge.
   */
  fadeColor?: string;
}

export default function LockedContentBlur({
  locked = false,
  children,
  style,
  onPressLocked,
  fadeColor = colors.background.card,
}: LockedContentBlurProps) {
  const feather = [
    fadeColor,
    `${fadeColor}${CLEAR_ALPHA}`,
    `${fadeColor}${CLEAR_ALPHA}`,
    fadeColor,
  ] as const;

  return (
    <View style={[styles.wrap, style]}>
      {children}
      {locked ? (
        <>
          <LockedScrim
            style={styles.bleedOverlay}
            color={`${fadeColor}${FROST_ALPHA}`}
          />
          <LinearGradient
            pointerEvents="none"
            colors={feather}
            locations={[0, 0.14, 0.86, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.bleedOverlay}
          />
          <LinearGradient
            pointerEvents="none"
            colors={feather}
            locations={[0, 0.18, 0.82, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.bleedOverlay}
          />
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
  pressTarget: {
    ...StyleSheet.absoluteFillObject,
    top: -5,
    right: -5,
    bottom: -5,
    left: -5,
  },
});
