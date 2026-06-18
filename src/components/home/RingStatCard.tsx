import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Icon, { type IconName } from '../common/icons/Icon';
import CardSurface from '../common/CardSurface';

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

const RING_SIZE = 92;
const STROKE = 7;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;
const R = RING_SIZE / 2 - STROKE / 2 - 4;
const INNER_R = R - STROKE / 2 - 8;
const START_ANGLE = 135;
const SWEEP = 270;

const RECT = Skia.XYWHRect(CX - R, CY - R, R * 2, R * 2);

const TRACK_PATH = Skia.Path.Make();
TRACK_PATH.addArc(RECT, START_ANGLE, SWEEP);

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
  const clamped = Math.max(0, Math.min(1, progress));

  const progressPath = Skia.Path.Make();
  if (clamped > 0) {
    progressPath.addArc(RECT, START_ANGLE, SWEEP * clamped);
  }

  return (
    <CardSurface containerStyle={styles.cardContainer} style={styles.card}>
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
        <View style={styles.ringSurface}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={TRACK_PATH}
              style="stroke"
              strokeWidth={STROKE}
              strokeCap="round"
              color={trackColor}
            />
            {clamped > 0 && (
              <Path
                path={progressPath}
                style="stroke"
                strokeWidth={STROKE}
                strokeCap="round"
                color={color}
              />
            )}

            <Circle cx={CX} cy={CY + 3} r={INNER_R + 3} color="rgba(15,23,42,0.04)" />
            <Circle cx={CX} cy={CY + 1.5} r={INNER_R + 1.5} color="rgba(15,23,42,0.02)" />
            <Circle cx={CX} cy={CY} r={INNER_R + 1} color={colors.neutral[200]} />
            <Circle cx={CX} cy={CY} r={INNER_R} color={colors.background.elevated} />
          </Canvas>
          <View style={styles.iconCenter} pointerEvents="none">
            <Icon name={icon} size={30} color={color} />
          </View>
        </View>
      </View>
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  card: {
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
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  target: {
    ...typography.label.small,
    fontSize: 13,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  label: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
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
    fontWeight: '500',
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ringSurface: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
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
