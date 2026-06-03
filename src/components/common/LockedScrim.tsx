import { StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface';
import { colors } from '../../theme/colors';

interface Props {
  // Blur strength on iOS < 26 and Android. Ignored for Reduce Transparency (scrim).
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: ViewProps['pointerEvents'];
}

// Obscuring frost that gates Pro/locked content. Never uses Liquid Glass:
// liquid is a chrome material that stays see-through, so it would not hide the
// content it is meant to gate. Resolves to blur on iOS < 26 and Android, or an
// opaque scrim when Reduce Transparency is enabled.
//
// The blur must be strong enough to actually obscure: a low intensity plus a
// heavy fill reads as a flat translucent panel, not a blur. Use a high
// intensity and a light tint so the blur itself does the obscuring.
export default function LockedScrim({
  intensity = 25,
  style,
  pointerEvents = 'none',
}: Props) {
  return (
    <GlassSurface
      bare
      forceFallback
      blurIntensity={intensity}
      blurColor={colors.glass.fillClear}
      solidColor={colors.glass.lockedScrim}
      style={style ?? StyleSheet.absoluteFill}
      pointerEvents={pointerEvents}
    />
  );
}
