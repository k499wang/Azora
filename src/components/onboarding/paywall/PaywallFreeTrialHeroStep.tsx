import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { colors } from '../../../theme/colors';
import Icon from '../../common/icons/Icon';
import { paywallStepStyles as styles } from './paywallStepStyles';

export function PaywallFreeTrialHeroStep() {
  const swing = useRef(new Animated.Value(0)).current;
  const badgePop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const HALF_PERIOD = 150;
    const pendulum = (toValue: number, duration: number) =>
      Animated.timing(swing, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });

    Animated.sequence([
      Animated.delay(240),
      Animated.spring(badgePop, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      pendulum(1, 120),
      pendulum(-0.72, HALF_PERIOD),
      pendulum(0.52, HALF_PERIOD),
      pendulum(-0.37, HALF_PERIOD),
      pendulum(0.26, HALF_PERIOD),
      pendulum(-0.18, HALF_PERIOD),
      pendulum(0.1, HALF_PERIOD),
      pendulum(0, HALF_PERIOD),
    ]).start();
  }, [swing, badgePop]);

  const rotate = swing.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  return (
    <View style={styles.heroContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          We&apos;ll send you a reminder before your trial ends
        </Text>
      </View>

      <View style={styles.bellWrap}>
        <Animated.View
          style={{
            transform: [{ translateY: -110 }, { rotate }, { translateY: 110 }],
          }}
        >
          <Icon name="bell" size={250} color={colors.primary.blue300} />
          <Animated.View style={[styles.bellBadge, { transform: [{ scale: badgePop }] }]}>
            <Text style={styles.bellBadgeText}>1</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Text style={styles.bellHint}>Make sure your notifications are on.</Text>
    </View>
  );
}

export default PaywallFreeTrialHeroStep;
