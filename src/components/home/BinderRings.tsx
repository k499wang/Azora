import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface Props {
  count?: number;
}

export default function BinderRings({ count = 3 }: Props) {
  return (
    <View style={styles.column} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.ringGroup}>
          {/* Punch hole — background color with realistic punched-hole shadow */}
          <View style={styles.punchHole}>
            <LinearGradient
              colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.03)', 'transparent']}
              locations={[0, 0.25, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.punchHoleShadow}
            />
          </View>

          {/* Thin plastic ring — cylindrical 3D look via gradient shading */}
          <View style={styles.ringOuter}>
            <LinearGradient
              colors={[
                colors.neutral[100],
                colors.neutral[50],
                colors.neutral[100],
                colors.neutral[200],
                colors.neutral[300],
              ]}
              locations={[0, 0.15, 0.35, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.ringBody}
            >
              {/* Top highlight — light catching the rounded top */}
              <View style={styles.topHighlight} />
              {/* Bottom shadow edge — cylindrical depth */}
              <View style={styles.bottomShadow} />
            </LinearGradient>
          </View>
        </View>
      ))}
    </View>
  );
}

const RING_WIDTH = 18;
const RING_HEIGHT = 10;
const PUNCH_HOLE_SIZE = 16;
const LEFT_OFFSET = -10;

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    left: LEFT_OFFSET,
    top: 0,
    bottom: 0,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 3,
  },
  ringGroup: {
    width: RING_WIDTH,
    height: RING_HEIGHT,
  },
  ringOuter: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: RING_WIDTH,
    height: RING_HEIGHT,
    borderRadius: RING_HEIGHT / 2,
    // Cast shadow — ring sitting on the card surface
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 1, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2,
  },
  ringBody: {
    width: RING_WIDTH,
    height: RING_HEIGHT,
    borderRadius: RING_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 1,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 1,
    right: 1,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderBottomLeftRadius: RING_HEIGHT / 2 - 1,
    borderBottomRightRadius: RING_HEIGHT / 2 - 1,
  },
  punchHole: {
    position: 'absolute',
    left: 12,
    top: (RING_HEIGHT - PUNCH_HOLE_SIZE) / 2,
    width: PUNCH_HOLE_SIZE,
    height: PUNCH_HOLE_SIZE,
    borderRadius: PUNCH_HOLE_SIZE / 2,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    zIndex: 1,
  },
  punchHoleShadow: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: PUNCH_HOLE_SIZE * 0.45,
  },
});
