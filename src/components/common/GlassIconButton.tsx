import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { colors } from '../../theme/colors';

const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

interface Props {
  children: ReactNode;
  onPress: () => void;
  style?: object;
}

export default function GlassIconButton({ children, onPress, style }: Props) {
  const size = 36;
  return (
    <Pressable onPress={onPress} style={style}>
      <View style={styles.outer}>
        {canUseLiquidGlass ? (
          <GlassView
            colorScheme="light"
            glassEffectStyle="clear"
            style={[{ width: size, height: size, borderRadius: size / 2 }, StyleSheet.absoluteFillObject]}
            tintColor="rgba(255,255,255,0.46)"
          />
        ) : (
          <BlurView
            intensity={76}
            tint="systemUltraThinMaterialLight"
            style={[
              { width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(255,255,255,0.6)' },
              StyleSheet.absoluteFillObject,
            ]}
          />
        )}
        {/* Top highlight stripe */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: size / 2,
            borderTopLeftRadius: size / 2,
            borderTopRightRadius: size / 2,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
          pointerEvents="none"
        />
        <View style={styles.iconCenter} pointerEvents="box-none">
          {children}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: colors.primary.blue700,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
