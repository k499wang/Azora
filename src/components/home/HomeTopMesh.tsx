import { StyleSheet, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export default function HomeTopMesh() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <ClipPath id="topShell">
            <Path d="M0 0 H100 V100 H0 Z" />
          </ClipPath>

          <LinearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#EAF2FF" />
            <Stop offset="55%" stopColor="#BDD7FF" />
            <Stop offset="100%" stopColor="#78B4FF" />
          </LinearGradient>

          <LinearGradient id="arcHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <G clipPath="url(#topShell)">
          <Rect x="0" y="0" width="100" height="100" fill="url(#baseGradient)" />

          <Path
            d="M-5 62 C25 38 55 30 105 52 L105 -5 L-5 -5 Z"
            fill="url(#arcHighlight)"
          />
        </G>
      </Svg>
    </View>
  );
}
