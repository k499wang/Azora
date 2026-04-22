import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface Task {
  id: string;
  label: string;
  value: string;
  icon: keyof typeof import('@expo/vector-icons/build/MaterialCommunityIcons').glyphMap;
  done: boolean;
  color?: string;
}

const DEFAULT_TASKS: Task[] = [
  { id: 'am', label: 'Morning', value: 'Box breath', icon: 'weather-sunny', done: true, color: colors.orange[500] },
  { id: 'mid', label: 'Midday', value: '3 min reset', icon: 'silverware-fork-knife', done: false, color: colors.primary.blue500 },
  { id: 'pm', label: 'Evening', value: '4-7-8 hold', icon: 'fire', done: false, color: colors.orange[400] },
];

const RING_SIZE = 140;
const RING_STROKE = 8;

interface DailyPlanCardProps {
  tasks?: Task[];
}

export default function DailyPlanCard({ tasks = DEFAULT_TASKS }: DailyPlanCardProps) {
  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const remaining = total - completed;
  const progress = total === 0 ? 0 : completed / total;

  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = RING_SIZE / 2 - RING_STROKE / 2;

  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  const arc = Skia.Path.Make();
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  arc.addArc(rect, -90, 360 * progress);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today's plan</Text>

      <View style={styles.body}>
        <View style={styles.ringWrap}>
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={track}
                style="stroke"
                strokeWidth={RING_STROKE}
                color={colors.neutral[100]}
              />
              {progress > 0 && (
                <Path
                  path={arc}
                  style="stroke"
                  strokeWidth={RING_STROKE}
                  strokeCap="round"
                  color={colors.primary.blue500}
                />
              )}
            </Canvas>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={styles.ringNumber}>{remaining}</Text>
              <Text style={styles.ringLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        <View style={styles.taskList}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <MaterialCommunityIcons
                name={task.icon}
                size={22}
                color={task.color ?? colors.primary.blue500}
                style={styles.taskIcon}
              />
              <View style={styles.taskTextWrap}>
                <Text style={styles.taskLabel}>{task.label}</Text>
                <Text style={[styles.taskValue, task.done && styles.taskValueDone]}>
                  {task.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.title.title2,
    color: colors.text.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    fontFamily: 'Nunito-Bold',
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 42,
    color: colors.text.primary,
  },
  ringLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  taskList: {
    flex: 1,
    gap: spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskIcon: {
    width: 26,
    textAlign: 'center',
  },
  taskTextWrap: {
    flex: 1,
  },
  taskLabel: {
    ...typography.label.small,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  taskValue: {
    ...typography.body.small,
    color: colors.text.primary,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
  taskValueDone: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
});
