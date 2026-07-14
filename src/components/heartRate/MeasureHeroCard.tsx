import { Text } from '../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface MeasureHeroCardProps {
  onPress: () => void;
}

const CIRCLE_SIZE = 184;

/**
 * The single most prominent CTA on the Heart tab: a large standalone circular
 * button with a pulsing halo that signals "live / ready to read". Tap the circle
 * to open the camera capture flow.
 */
export function MeasureHeroCard({ onPress }: MeasureHeroCardProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.circleWrap, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Measure heart rate"
      >
        <PulseHalo />
        <View style={styles.circle}>
          <MaterialCommunityIcons
            name="heart-plus-outline"
            size={52}
            color={colors.text.inverse}
          />
          <Text style={styles.circleLabel}>Measure</Text>
        </View>
      </Pressable>
    </View>
  );
}

function PulseHalo() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.halo,
        {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  halo: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.error[400],
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error[400],
    borderWidth: 5,
    borderColor: colors.error[300],
    shadowColor: colors.error[700],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 4,
  },
  circleLabel: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
