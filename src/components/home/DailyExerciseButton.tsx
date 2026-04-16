import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, BlurMask, LinearGradient, vec } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface DailyExerciseButtonProps {
  onPress: () => void;
}

const SIZE = 320; // Increased from 240 for a larger presence
const CENTER = SIZE / 2;

export default function DailyExerciseButton({ onPress }: DailyExerciseButtonProps) {
  return (
    <View style={styles.container}>
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed
        ]}
      >
        <Canvas style={styles.canvas}>
          {/* Outer Bloom */}
          <Circle cx={CENTER} cy={CENTER} r={110} color="rgba(30, 99, 214, 0.22)">
            <BlurMask blur={60} style="normal" />
          </Circle>

          {/* Core Glow */}
          <Circle cx={CENTER} cy={CENTER} r={95} color="rgba(30, 99, 214, 0.40)">
            <BlurMask blur={25} style="normal" />
          </Circle>

          {/* Main Button Surface - Increased radius */}
          <Circle cx={CENTER} cy={CENTER} r={82}>
            <LinearGradient
              start={vec(CENTER - 82, CENTER - 82)}
              end={vec(CENTER + 82, CENTER + 82)}
              colors={[colors.primary.blue500, colors.primary.blue700]}
            />
          </Circle>
        </Canvas>

        {/* Text Overlay */}
        <View pointerEvents="none" style={styles.textOverlay}>
          <Text style={styles.label}>Start</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    marginVertical: -48,
  },
  pressable: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: SIZE,
    height: SIZE,
  },
  textOverlay: {
    position: 'absolute',
    width: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.title.title2,
    color: colors.text.inverse,
    letterSpacing: 2,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
