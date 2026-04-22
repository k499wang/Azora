import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface BigRingStatCardProps {
  label: string;
  value: string;
  target?: string;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const RING_SIZE = 120;
const STROKE = 9;

export default function BigRingStatCard({
  label,
  value,
  target,
  progress,
  color = colors.neutral[900],
  trackColor = colors.neutral[200],
  icon,
}: BigRingStatCardProps) {
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
      <MaterialCommunityIcons
        name="information-outline"
        size={14}
        color={colors.text.tertiary}
        style={styles.infoIcon}
      />
      <View style={styles.ringWrap}>
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
            <MaterialCommunityIcons name={icon} size={32} color={color} />
          </View>
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {target ? <Text style={styles.target}>/{target}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 0,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    ...typography.title.title3,
    fontSize: 24,
    color: colors.text.primary,
    fontFamily: 'Nunito-Bold',
    fontWeight: '800',
  },
  target: {
    ...typography.label.small,
    fontSize: 14,
    color: colors.text.tertiary,
    fontFamily: 'Nunito-SemiBold',
  },
  label: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  ringWrap: {
    alignItems: 'center',
  },
  infoIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
