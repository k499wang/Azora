import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HexRoom } from '../../../features/room/RoomScene';
import { ROOM_SHELLS, ROOM_STYLES } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import { getMochiStageWidth } from '../MochiStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { duration, easing } from '../../../theme/motion';

/** how long each room holds still before the track moves on */
const DWELL_MS = 2000;
const GAP = spacing.lg;

interface MochiRoomsScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function MochiRoomsScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: MochiRoomsScreenProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = getMochiStageWidth(screenWidth, screenHeight);
  const reducedMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  // The track walks to the end and back rather than rewinding past every room
  // it just showed.
  const direction = useRef(1);
  const x = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => {
        let next = current + direction.current;
        if (next >= ROOM_STYLES.length || next < 0) {
          direction.current = -direction.current;
          next = current + direction.current;
        }
        return next;
      });
    }, DWELL_MS);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const target = -index * (width + GAP);

    if (reducedMotion) {
      x.value = target;
      return undefined;
    }

    x.value = withTiming(target, {
      duration: duration.slow,
      easing: easing.settle,
    });

    return () => cancelAnimation(x);
  }, [index, reducedMotion, width, x]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  // Empty on purpose: this screen is about the room they pick, and a furnished
  // one shows the decorations they have not earned yet. Building them is still
  // expensive and they never change, so the rooms are built once and only the
  // track they sit on moves.
  const rooms = useMemo(
    () =>
      ROOM_STYLES.map((style) => (
        <View key={style.shell} style={{ width, marginRight: GAP }}>
          <HexRoom
            width={width}
            picks={{}}
            shell={ROOM_SHELLS[style.shell]}
            frameHue={style.frameHue}
          />
        </View>
      )),
    [width],
  );

  return (
    <OnboardingScreenLayout
      title={`Then you pick another room for ${MASCOT_NAME}.`}
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={<OnboardingPrimaryButton label="Got it" onPress={onContinue} />}
    >
      <View
        style={[styles.viewport, { width }]}
        accessible
        accessibilityLabel={`${ROOM_STYLES.length} room styles to choose from`}
      >
        <Animated.View style={[styles.track, trackStyle]}>{rooms}</Animated.View>
      </View>

      <View style={styles.dots}>
        {ROOM_STYLES.map((style, i) => (
          <View
            key={style.shell}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  // The track is wider than the screen; without this the rooms waiting their
  // turn hang past the margins.
  viewport: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.blue200,
  },
  dotActive: {
    backgroundColor: colors.primary.blue600,
  },
});
