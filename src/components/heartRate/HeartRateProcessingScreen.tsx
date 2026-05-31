import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DotsLoader } from '../common/DotsLoader';
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

export function HeartRateProcessingScreen({
  title = 'Analyzing your heart rhythm',
  message = 'Building your recovery profile',
  backgroundColor = colors.background.primary,
  accentColor = colors.primary.blue600,
  titleColor = colors.text.primary,
  messageColor = colors.text.secondary,
}: HeartRateProcessingScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.34],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container} pointerEvents="auto">
        <View style={styles.visual}>
          <Animated.View
            style={[
              styles.halo,
              {
                backgroundColor: accentColor,
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          <View style={[styles.iconShell, { borderColor: accentColor + '33' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={42} color={accentColor} />
          </View>
        </View>

        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
        <View style={styles.spinner}>
          <DotsLoader color={accentColor} />
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
});
