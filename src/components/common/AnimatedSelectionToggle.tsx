import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import Icon from './icons/Icon';

const TOGGLE_SIZE = 24;
const MARK_SIZE = TOGGLE_SIZE - 8;

/** The add/added mark shared by multi-select choices across the app. */
export default function AnimatedSelectionToggle({ selected }: { selected: boolean }) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, selected]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toggle, { backgroundColor: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.neutral[300], colors.primary.blue500],
      }) }]}
    >
      <Animated.View style={[styles.mark, {
        opacity: progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0, 0],
        }),
        transform: [{ rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '90deg'],
        }) }],
      }]}>
        <Icon name="plus-bold" size={MARK_SIZE} color={colors.neutral[0]} />
      </Animated.View>
      <Animated.View style={[styles.mark, {
        opacity: progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        }),
        transform: [{ scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        }) }],
      }]}>
        <Icon name="check-bold" size={MARK_SIZE} color={colors.neutral[0]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: TOGGLE_SIZE,
    height: TOGGLE_SIZE,
    borderRadius: TOGGLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
