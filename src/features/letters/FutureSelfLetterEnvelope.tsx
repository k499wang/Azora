import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { Text } from '../../components/common/Text';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Polys } from '../room/RoomScene';
import { ENVELOPE, ENVELOPE_BACK } from './letterArt';
import WaxSeal from './WaxSeal';

interface Props {
  recipientName: string | null;
  onPress: () => void;
}

const VIEW_WIDTH = ENVELOPE.width;
const VIEW_HEIGHT = ENVELOPE.height;
const FLAP_TIP_Y = ENVELOPE.tip[1];
const SEAL_SIZE = 46;
const SETTLE_TILT = 1.5;
const PRESSED_SCALE = 0.97;
const SETTLE_DELAY_MS = 250;
const SPRING = { damping: 9, stiffness: 140, mass: 0.8 };

export default function FutureSelfLetterEnvelope({ recipientName, onPress }: Props) {
  const [width, setWidth] = useState(0);
  const tilt = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    tilt.value = withDelay(
      SETTLE_DELAY_MS,
      withSequence(withSpring(SETTLE_TILT, SPRING), withSpring(0, SPRING)),
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
              <Polys polys={ENVELOPE_BACK} />
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
    backgroundColor: colors.background.card,
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
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  from: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
});
