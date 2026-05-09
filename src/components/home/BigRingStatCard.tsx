import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import Icon, { type IconName } from '../common/icons/Icon';

interface BigRingStatCardProps {
  label: string;
  value: string;
  target?: string;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  icon: IconName;
  info?: { title: string; message: string };
}

const RING_SIZE = 120;
const STROKE = 8;

export default function BigRingStatCard({
  label,
  value,
  target,
  progress,
  color = colors.neutral[900],
  trackColor = colors.neutral[200],
  icon,
  info,
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
      {info ? (
        <Pressable
          hitSlop={12}
          onPress={() => Alert.alert(info.title, info.message)}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.tertiary}
          />
        </Pressable>
      ) : null}
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
            <Icon name={icon} size={48} color={color} />
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
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
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
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  target: {
    ...typography.label.small,
    fontSize: 14,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  label: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  ringWrap: {
    alignItems: 'center',
  },
  infoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
