import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Text } from '../../components/common/Text';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import WaxSeal from './WaxSeal';

interface Props {
  recipientName: string | null;
  onPress: () => void;
}

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 200;
const FLAP_TIP_Y = 92;
const SEAL_SIZE = 46;
const REST_TILT = -2;
const SETTLE_TILT = 1;
const PRESSED_SCALE = 0.97;
const SETTLE_DELAY_MS = 250;
const SPRING = { damping: 9, stiffness: 140, mass: 0.8 };

const STAMP = { x: 262, y: 14, width: 40, height: 48 };

export default function FutureSelfLetterEnvelope({ recipientName, onPress }: Props) {
  const [width, setWidth] = useState(0);
  const tilt = useSharedValue(REST_TILT);
  const scale = useSharedValue(1);

  useEffect(() => {
    tilt.value = withDelay(
      SETTLE_DELAY_MS,
      withSequence(withSpring(SETTLE_TILT, SPRING), withSpring(REST_TILT, SPRING)),
    );
  }, [tilt]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt.value}deg` }, { scale: scale.value }],
  }));

  const unit = width / VIEW_WIDTH;
  const sealSize = SEAL_SIZE * unit;

  return (
    <Animated.View style={[styles.envelope, motion]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="A message from future you. Tap to open."
        onPressIn={() => {
          scale.value = withSpring(PRESSED_SCALE, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.body}
      >
        {width > 0 ? (
          <>
            <Svg
              width={width}
              height={width / (VIEW_WIDTH / VIEW_HEIGHT)}
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              style={StyleSheet.absoluteFill}
            >
              <Path d={`M0 0 L150 106 L0 ${VIEW_HEIGHT} Z`} fill={colors.envelope.flapSide} />
              <Path
                d={`M${VIEW_WIDTH} 0 L170 106 L${VIEW_WIDTH} ${VIEW_HEIGHT} Z`}
                fill={colors.envelope.flapSide}
              />
              <Path
                d={`M0 ${VIEW_HEIGHT} L160 96 L${VIEW_WIDTH} ${VIEW_HEIGHT} Z`}
                fill={colors.envelope.flapBottom}
              />
              <Path
                d={`M0 0 L${VIEW_WIDTH} 0 L160 ${FLAP_TIP_Y} Z`}
                fill={colors.envelope.flapTop}
                stroke={colors.envelope.crease}
                strokeWidth={1}
                strokeLinejoin="round"
              />
              <Line
                x1={8}
                y1={3}
                x2={VIEW_WIDTH - 8}
                y2={3}
                stroke={colors.envelope.crease}
                strokeOpacity={0.6}
                strokeWidth={0.75}
              />
              <Rect
                x={STAMP.x}
                y={STAMP.y}
                width={STAMP.width}
                height={STAMP.height}
                fill={colors.background.elevated}
                stroke={colors.background.elevated}
                strokeWidth={5}
                strokeDasharray="0.1 5"
                strokeLinecap="round"
              />
              <Rect
                x={STAMP.x + 4}
                y={STAMP.y + 4}
                width={STAMP.width - 8}
                height={STAMP.height - 8}
                rx={2}
                fill={colors.playful.night.base}
              />
              <Circle cx={STAMP.x + 20} cy={STAMP.y + 26} r={9} fill={colors.playful.amber.mid} />
              <Circle cx={STAMP.x + 24} cy={STAMP.y + 22} r={8} fill={colors.playful.night.base} />
              <Circle cx={STAMP.x + 12} cy={STAMP.y + 13} r={1.5} fill={colors.playful.amber.mid} />
              <Circle cx={STAMP.x + 28} cy={STAMP.y + 36} r={1.1} fill={colors.playful.amber.mid} />
            </Svg>
            <View
              pointerEvents="none"
              style={[
                styles.seal,
                { top: FLAP_TIP_Y * unit - sealSize / 2, marginLeft: -sealSize / 2 },
              ]}
            >
              <WaxSeal size={sealSize} />
            </View>
            <View
              pointerEvents="none"
              style={[styles.address, { top: FLAP_TIP_Y * unit + sealSize / 2 + spacing.xs }]}
            >
              <Text style={styles.to} numberOfLines={1}>
                To: {recipientName ?? 'you'}
              </Text>
              <Text style={styles.from}>From: future you</Text>
            </View>
          </>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  envelope: {
    ...card.shadow,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.envelope.paper,
    borderRadius: radius.xs,
    borderCurve: 'continuous',
  },
  body: {
    aspectRatio: VIEW_WIDTH / VIEW_HEIGHT,
    borderRadius: radius.xs,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  seal: {
    position: 'absolute',
    left: '50%',
  },
  address: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  to: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  from: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
});
