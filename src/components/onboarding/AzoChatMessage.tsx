import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { triggerMessageHaptic } from '../../native/tapHaptics';
import { spring, travel } from '../../theme/motion';

/** How small a bubble starts before it pops out to full size. */
const BUBBLE_START_SCALE = 0.82;

interface AzoChatMessageProps {
  children: ReactNode;
  /** Azo's bubbles grow out of his side of the chat, the reader's out of theirs. */
  side: 'azo' | 'reply';
  animate: boolean;
  active: boolean;
  reducedMotion: boolean;
  style: StyleProp<ViewStyle>;
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Each new bubble enters once; returning to the chat leaves history still.
 *
 * Core Animated rather than Reanimated: every arriving message re-renders the
 * transcript, and with the sync-UI-props flags a Reanimated view is handed its
 * first-render style on re-render — opacity 0 — so landed bubbles blanked out.
 * Core Animated keeps the value it finished on.
 */
export default function AzoChatMessage({
  children,
  side,
  animate,
  active,
  reducedMotion,
  style,
  onLayout,
}: AzoChatMessageProps) {
  const entered = useRef(!animate || reducedMotion);
  const arrival = useRef(new Animated.Value(entered.current ? 1 : 0)).current;

  useEffect(() => {
    if (!active) {
      arrival.stopAnimation();
      if (entered.current) arrival.setValue(1);
      return;
    }
    if (entered.current || reducedMotion) {
      entered.current = true;
      arrival.setValue(1);
      return;
    }
    entered.current = true;
    // An arriving bubble is felt as it lands, on the beat of its own entrance.
    triggerMessageHaptic();
    const pop = Animated.spring(arrival, {
      toValue: 1,
      ...spring.snap,
      useNativeDriver: true,
      isInteraction: false,
    });
    pop.start();
    return () => {
      pop.stop();
      arrival.setValue(1);
    };
  }, [active, arrival, reducedMotion]);

  // A reply rises further, from where the choices sat under the transcript.
  const rise = side === 'reply' ? travel.drop : travel.rise;
  const animationStyle = useMemo(
    () => ({
      opacity: arrival.interpolate({ inputRange: [0, 0.45], outputRange: [0, 1], extrapolate: 'clamp' }),
      transform: [
        { translateY: arrival.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) },
        { scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [BUBBLE_START_SCALE, 1] }) },
      ],
    }),
    [arrival, rise],
  );

  return (
    <Animated.View
      style={[style, side === 'reply' ? styles.replyOrigin : styles.azoOrigin, animationStyle]}
      onLayout={onLayout}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  azoOrigin: { transformOrigin: 'left bottom' },
  replyOrigin: { transformOrigin: 'right bottom' },
});
