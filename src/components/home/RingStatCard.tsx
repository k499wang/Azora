import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface RingStatCardProps {
  label: string;
  value: string;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const RING_SIZE = 104;
const STROKE = 7;

export default function RingStatCard({
  label,
  value,
  progress,
  color = colors.neutral[900],
  trackColor = colors.neutral[100],
  icon,
}: RingStatCardProps) {
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = RING_SIZE / 2 - STROKE / 2;
  const clamped = Math.max(0, Math.min(1, progress));

  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  const arc = Skia.Path.Make();
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  arc.addArc(rect, -90, 360 * clamped);

  return (
    <View style={styles.card}>
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Path path={track} style="stroke" strokeWidth={STROKE} color={trackColor} />
          {clamped > 0 && (
            <Path
              path={arc}
              style="stroke"
              strokeWidth={STROKE}
              strokeCap="round"
              color={color}
            />
          )}
        </Canvas>
        <View style={styles.iconCenter} pointerEvents="none">
          <MaterialCommunityIcons name={icon} size={26} color={colors.text.primary} />
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  value: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: 'Nunito-Bold',
    fontWeight: '800',
  },
});
