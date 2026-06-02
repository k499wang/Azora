import { useEffect } from 'react';
import {
  BackHandler,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface HeartRateProcessingScreenProps {
  title?: string;
  message?: string;
  backgroundColor?: string;
  accentColor?: string;
  titleColor?: string;
  messageColor?: string;
}

interface ProcessingDotProps {
  color: string;
  index: number;
  size: number;
}

function ProcessingDot({ color, index, size }: ProcessingDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 160,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 400,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 400,
            easing: Easing.inOut(Easing.ease),
          }),
          withDelay((2 - index) * 160, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(progress);
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + progress.value * 0.75,
    transform: [{ translateY: -size * 0.6 * progress.value }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

function ProcessingDots({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((index) => (
        <ProcessingDot key={index} color={color} index={index} size={size} />
      ))}
    </View>
  );
}

export function HeartRateProcessingScreen({
  title = 'Analyzing your heart rhythm',
  message = 'Building your recovery profile',
  backgroundColor = colors.background.primary,
  accentColor = colors.primary.blue600,
  titleColor = colors.text.primary,
  messageColor = colors.text.secondary,
}: HeartRateProcessingScreenProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + pulse.value * 0.18,
    transform: [{ scale: 0.92 + pulse.value * 0.16 }],
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container} pointerEvents="auto">
        <View style={styles.visual}>
          <Reanimated.View
            style={[
              styles.halo,
              {
                backgroundColor: accentColor,
              },
              haloStyle,
            ]}
          />
          <View style={[styles.iconShell, { borderColor: accentColor + '33' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={42} color={accentColor} />
          </View>
        </View>

        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
        <View style={styles.spinner}>
          <ProcessingDots color={accentColor} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  visual: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 66,
  },
  iconShell: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
  },
  message: {
    ...typography.body.medium,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {},
});
