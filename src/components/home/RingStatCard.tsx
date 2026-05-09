import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import Icon, { type IconName } from '../common/icons/Icon';

interface RingStatCardProps {
  label: string;
  value: string;
  target?: string;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  icon: IconName;
  trend?: {
    direction: 'up' | 'down';
    delta?: string;
  };
  info?: { title: string; message: string };
}

const RING_SIZE = 76;
const STROKE = 8;

export default function RingStatCard({
  label,
  value,
  target,
  progress,
  color = colors.neutral[900],
  trackColor = colors.neutral[100],
  icon,
  trend,
  info,
}: RingStatCardProps) {
  const trendColor = trend?.direction === 'up' ? colors.success[500] : colors.error[500];
  const trendIcon = trend?.direction === 'up' ? 'arrow-top-right' : 'arrow-bottom-right';
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
          hitSlop={10}
          onPress={() => Alert.alert(info.title, info.message)}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color={colors.text.tertiary}
          />
        </Pressable>
      ) : null}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {target ? <Text style={styles.target}>/{target}</Text> : null}
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {trend ? (
          <View style={styles.trendWrap}>
            <MaterialCommunityIcons name={trendIcon} size={12} color={trendColor} />
            {trend.delta ? (
              <Text style={[styles.trendText, { color: trendColor }]}>{trend.delta}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

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
            <Icon name={icon} size={34} color={color} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    ...typography.title.title3,
    fontSize: 21,
    lineHeight: 26,
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
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  trendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    ...typography.caption.caption2,
    fontSize: 11,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
