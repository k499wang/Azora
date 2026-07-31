import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../theme/colors';

/*
  PhoneFrame wraps content in a scaled-down iPhone-style bezel.
  The inner content is rendered at iPhone logical size (393 × 852 pts)
  and the whole frame is scaled down to fit the carousel.
  Works with both <Image> and React components.
*/

const LOGICAL_WIDTH = 393;
const LOGICAL_HEIGHT = 852;
const WIDTH_FRACTION = 0.42;
const MAX_WIDTH = 180;

interface PhoneFrameProps {
  children: React.ReactNode;
  maxHeight?: number;
}

export default function PhoneFrame({ children, maxHeight }: PhoneFrameProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Scaling from width alone overflows short screens: the 393×852 aspect turns
  // a 157pt-wide frame into a 341pt-tall one, more than an iPhone SE can spare.
  // Callers that know their available height pass it so the binding constraint
  // wins instead of the frame silently clipping.
  const widthScale =
    Math.min(screenWidth * WIDTH_FRACTION, MAX_WIDTH) / LOGICAL_WIDTH;
  const scale =
    maxHeight && maxHeight > 0
      ? Math.min(widthScale, maxHeight / LOGICAL_HEIGHT)
      : widthScale;

  return (
    <View
      style={[
        styles.root,
        {
          width: LOGICAL_WIDTH * scale,
          height: LOGICAL_HEIGHT * scale,
          borderRadius: 48 * scale,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            transform: [
              { translateX: -(LOGICAL_WIDTH * (1 - scale)) / 2 },
              { translateY: -(LOGICAL_HEIGHT * (1 - scale)) / 2 },
              { scale },
            ],
          },
        ]}
      >
        {/* Dynamic Island */}
        <View style={styles.notch} />

        {/* Screen */}
        <View style={styles.screen}>{children}</View>

        {/* Home indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: colors.neutral[900],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  inner: {
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    backgroundColor: colors.neutral[900],
    borderRadius: 48,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    margin: 10,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: colors.background.primary,
  },
  notch: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    width: 100,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[900],
    zIndex: 10,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.neutral[700],
    zIndex: 10,
  },
});
