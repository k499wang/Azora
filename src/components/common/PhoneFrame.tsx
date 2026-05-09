import { Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/*
  PhoneFrame wraps content in a scaled-down iPhone-style bezel.
  The inner content is rendered at iPhone logical size (393 × 852 pts)
  and the whole frame is scaled down to fit the carousel.
  Works with both <Image> and React components.
*/

const LOGICAL_WIDTH = 393;
const LOGICAL_HEIGHT = 852;
const TARGET_WIDTH = Math.min(SCREEN_WIDTH * 0.42, 180);
const SCALE = TARGET_WIDTH / LOGICAL_WIDTH;

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <View
      style={[
        styles.root,
        {
          width: TARGET_WIDTH,
          height: LOGICAL_HEIGHT * SCALE,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            transform: [
              { translateX: -(LOGICAL_WIDTH * (1 - SCALE)) / 2 },
              { translateY: -(LOGICAL_HEIGHT * (1 - SCALE)) / 2 },
              { scale: SCALE },
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
    borderRadius: 48 * SCALE,
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
