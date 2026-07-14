import { Text } from '../common/Text';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Icon, { type IconName } from '../common/icons/Icon';
import CardSurface from '../common/CardSurface';
import FeatureInfoDialog from '../common/FeatureInfoDialog';

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

const RING_SIZE = 150;
const STROKE = 8;
const RING_INSET = 16;

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
  const [infoVisible, setInfoVisible] = useState(false);
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = RING_SIZE / 2 - RING_INSET - STROKE / 2;
  const clamped = Math.max(0, Math.min(1, progress));

  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  const arc = Skia.Path.Make();
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  arc.addArc(rect, -90, 360 * clamped);

  return (
    <CardSurface containerStyle={styles.cardContainer} style={styles.card}>
      {info ? (
        <>
          <Pressable
            hitSlop={12}
            onPress={() => setInfoVisible(true)}
            style={styles.infoButton}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.text.tertiary}
            />
          </Pressable>
          <FeatureInfoDialog
            visible={infoVisible}
            onClose={() => setInfoVisible(false)}
            title={info.title}
            intro={info.message}
          />
        </>
      ) : null}
      <View style={styles.ringWrap}>
        <View style={styles.ringSurface}>
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
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  card: {
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
    fontWeight: '500',
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
