import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../theme/colors';

const MEADOW = require('../../../assets/app/home-meadow.png');
const MEADOW_ASPECT = 793 / 1983;

interface HomeMeadowBackgroundProps {
  /**
   * Where the artwork ends and the flat green takes over. Null until the room
   * has been laid out.
   */
  sceneHeight: number | null;
}

/**
 * The scene the home page sits in: sky, hills and path behind the room, and the
 * flat green the artwork ends on carried all the way down the page.
 *
 * The artwork is deliberately wide so a tablet gets the whole panorama. A phone
 * can't show that width without the horizon collapsing into a strip, so the
 * scene is sized to the room above the dailies and the sides are cropped — the
 * narrower the screen, the more it crops and the taller the scene stands.
 */
export default function HomeMeadowBackground({
  sceneHeight,
}: HomeMeadowBackgroundProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.fill} pointerEvents="none">
      <Image
        source={MEADOW}
        style={{
          width,
          height: sceneHeight ?? width * MEADOW_ASPECT,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.meadow,
  },
});
