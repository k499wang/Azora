import { useImperativeHandle, forwardRef, useRef, ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const TRACK_WIDTH = 260;
const BALL_SIZE = 44;
// Ball left-edge travels from 0 → TRACK_WIDTH so its center aligns with track ends
const BALL_TRAVEL = TRACK_WIDTH;
const CONTAINER_WIDTH = TRACK_WIDTH + BALL_SIZE;

export interface BreathingCircleRef {
  expand: (duration: number) => void;
  contract: (duration: number) => void;
  pause: () => void;
  resumeExpand: (remainingSecs: number) => void;
  resumeContract: (remainingSecs: number) => void;
  reset: () => void;
}

interface BreathingCircleProps {
  children?: ReactNode;
}

const BreathingCircle = forwardRef<BreathingCircleRef, BreathingCircleProps>(
  ({ children }, ref) => {
    const ballX = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      expand(duration: number) {
        Animated.timing(ballX, {
          toValue: BALL_TRAVEL,
          duration: duration * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start();
      },
      contract(duration: number) {
        Animated.timing(ballX, {
          toValue: 0,
          duration: duration * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start();
      },
      pause() {
        ballX.stopAnimation();
      },
      resumeExpand(remainingSecs: number) {
        Animated.timing(ballX, {
          toValue: BALL_TRAVEL,
          duration: remainingSecs * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start();
      },
      resumeContract(remainingSecs: number) {
        Animated.timing(ballX, {
          toValue: 0,
          duration: remainingSecs * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start();
      },
      reset() {
        ballX.stopAnimation();
        ballX.setValue(0);
      },
    }));

    return (
      <View style={styles.wrapper}>
        {/* Track + ball row */}
        <View style={styles.trackRow}>
          {/* Track background */}
          <View style={styles.track}>
            <View style={styles.trackInner} />
          </View>

          {/* End markers */}
          <View style={[styles.endDot, { left: 0 }]} />
          <View style={[styles.endDot, { right: 0 }]} />

          {/* Ball */}
          <Animated.View style={[styles.ballContainer, { transform: [{ translateX: ballX }] }]}>
            <View style={styles.ball} />
          </Animated.View>
        </View>

        {/* Phase label + countdown rendered below the track */}
        <View style={styles.childrenContainer}>{children}</View>
      </View>
    );
  },
);

BreathingCircle.displayName = 'BreathingCircle';

export default BreathingCircle;

const TRACK_TOP = (BALL_SIZE - 6) / 2;
const BALL_TOP = 0;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: CONTAINER_WIDTH,
    minHeight: 44 + 28 + 28 + 4 + 56,
  },
  trackRow: {
    width: CONTAINER_WIDTH,
    height: BALL_SIZE,
  },
  track: {
    position: 'absolute',
    left: BALL_SIZE / 2,
    right: BALL_SIZE / 2,
    top: TRACK_TOP,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0a1628',
    overflow: 'hidden',
  },
  trackInner: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#1a3a5c',
    opacity: 0.7,
  },
  endDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.blue400,
    top: TRACK_TOP - 2,
    opacity: 0.7,
  },
  ballContainer: {
    position: 'absolute',
    left: 0,
    top: BALL_TOP,
    width: BALL_SIZE,
    height: BALL_SIZE,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: colors.primary.blue500,
  },
  childrenContainer: {
    marginTop: 28,
    alignItems: 'center',
    gap: 4,
  },
});
