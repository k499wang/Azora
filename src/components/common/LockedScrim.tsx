import { StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface';
import { colors } from '../../theme/colors';

interface Props {
  // Blur strength on every supported platform and glass mode.
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: ViewProps['pointerEvents'];
}

// Obscuring frost that gates Pro/locked content. Always uses BlurView so the
// gated treatment remains consistent across Liquid Glass, fallback, and
// Reduce Transparency modes.
//
// Moderate intensity keeps the native blur visible across platforms without
// making underlying high-contrast content appear as a heavy shadow.
export default function LockedScrim({
  intensity = 50,
  style,
  pointerEvents = 'none',
}: Props) {
  return (
    <GlassSurface
      bare
      forceBlur
      blurIntensity={intensity}
      blurColor={colors.glass.fillClear}
      style={style ?? StyleSheet.absoluteFill}
      pointerEvents={pointerEvents}
    />
  );
}
