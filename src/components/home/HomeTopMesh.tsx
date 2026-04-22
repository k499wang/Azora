import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export default function HomeTopMesh() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="bgGlow" cx="52%" cy="12%" r="88%">
            <Stop offset="0%" stopColor="#F7FBFF" />
            <Stop offset="38%" stopColor="#DCEBFF" />
            <Stop offset="72%" stopColor="#BDD7FF" />
            <Stop offset="100%" stopColor="#A6C8FF" />
          </RadialGradient>

          <LinearGradient id="waveOne" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.62" />
            <Stop offset="100%" stopColor="#9FC5FF" stopOpacity="0.10" />
          </LinearGradient>

          <LinearGradient id="waveTwo" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#A3C9FF" stopOpacity="0.34" />
            <Stop offset="100%" stopColor="#4A90F5" stopOpacity="0.12" />
          </LinearGradient>

          <LinearGradient id="waveThree" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.24" />
            <Stop offset="100%" stopColor="#78B4FF" stopOpacity="0.08" />
          </LinearGradient>

          <RadialGradient id="blobOne" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="blobTwo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#78B4FF" stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#78B4FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100" height="100" fill="url(#bgGlow)" />

        <Path
          d="M0 8 C14 2 26 0 42 6 C58 12 73 14 100 6 L100 34 C78 28 60 28 40 33 C24 37 13 38 0 32 Z"
          fill="url(#waveOne)"
        />
        <Path
          d="M0 24 C16 18 30 18 44 24 C61 32 76 34 100 25 L100 56 C79 53 61 54 43 60 C23 66 12 66 0 61 Z"
          fill="url(#waveTwo)"
        />
        <Path
          d="M0 47 C19 43 34 44 51 51 C68 58 82 60 100 54 L100 82 C81 82 65 84 48 90 C29 96 13 95 0 91 Z"
          fill="url(#waveThree)"
        />

        <Path
          d="M65 5 C78 2 92 10 95 22 C97 34 87 42 73 41 C60 40 51 30 54 19 C56 11 59 7 65 5 Z"
          fill="url(#blobOne)"
        />
        <Path
          d="M7 58 C16 52 30 54 35 65 C40 76 31 88 18 89 C8 90 0 83 1 73 C1 67 3 62 7 58 Z"
          fill="url(#blobTwo)"
        />
      </Svg>
    </View>
  );
}
