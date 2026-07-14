import { Text, AnimatedText } from '../common/Text';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MESSAGES = [
  'Breathe naturally — no need to slow down',
  'HRV reflects your nervous system balance',
  'Keep your finger still and warm',
  'Higher HRV is linked to better recovery',
  'Relax your shoulders and jaw',
  'Your heart rate varies slightly with every breath',
  'Stay steady — almost there',
  'Most adults rest between 60–100 bpm',
  'Try not to talk or move',
  'HRV tends to be highest in the morning',
  'Soft, even breaths work best',
  'A calm mind shows up in your rhythm',
];

const FADE_MS = 350;
const HOLD_MS = 4000;

export function RotatingSubtitle() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        setIndex((prev) => (prev + 1) % MESSAGES.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
      });
    }, HOLD_MS);

    return () => clearInterval(interval);
  }, [opacity]);

  return (
    <View style={styles.container} pointerEvents="none">
      <AnimatedText style={[styles.text, { opacity }]} numberOfLines={2}>
        {MESSAGES[index]}
      </AnimatedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  text: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
