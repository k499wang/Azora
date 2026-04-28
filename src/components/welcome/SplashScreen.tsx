import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onFinish: () => void;
}

const HOLD_MS = 600;
const FADE_MS = 250;

export function SplashScreen({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoSize = Dimensions.get('window').height * 0.25;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, HOLD_MS);

    return () => clearTimeout(timeout);
  }, [opacity, onFinish]);

  return (
    <Animated.View pointerEvents="none" style={[styles.root, { opacity }]}>
      <View style={styles.center}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface.welcome,
    zIndex: 1000,
    elevation: 1000,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
