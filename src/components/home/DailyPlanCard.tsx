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
  meta: string;
  icon: keyof typeof import('@expo/vector-icons/build/MaterialCommunityIcons').glyphMap;
  done: boolean;
}

const DEFAULT_TASKS: Task[] = [
  { id: 'am', label: 'Morning box breath', meta: '5 min', icon: 'weather-sunny', done: true },
  { id: 'mid', label: 'Midday reset', meta: '3 min', icon: 'white-balance-sunny', done: false },
  { id: 'pm', label: '4-7-8 wind down', meta: '7 min', icon: 'weather-night', done: false },
];

const RING_SIZE = 72;
const RING_STROKE = 8;

interface DailyPlanCardProps {
  tasks?: Task[];
}

export default function DailyPlanCard({ tasks = DEFAULT_TASKS }: DailyPlanCardProps) {
  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
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
            <Text style={styles.ringCount}>{`${completed}/${total}`}</Text>
          </View>
        </View>
        <Text style={styles.ringLabel}>Today's plan</Text>
      </View>

      <View style={styles.taskList}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <View style={[styles.taskIcon, task.done && styles.taskIconDone]}>
              <MaterialCommunityIcons
                name={task.done ? 'check' : task.icon}
                size={14}
                color={task.done ? colors.text.inverse : colors.primary.blue600}
              />
            </View>
            <Text
              style={[styles.taskLabel, task.done && styles.taskLabelDone]}
              numberOfLines={1}
            >
              {task.label}
            </Text>
            <Text style={styles.taskMeta}>{task.meta}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  ringWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCount: {
    ...typography.title.title3,
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  ringLabel: {
    ...typography.label.small,
    color: colors.text.secondary,
  },
  taskList: {
    flex: 1,
    gap: spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  taskIconDone: {
    backgroundColor: colors.primary.blue500,
  },
  taskLabel: {
    ...typography.body.small,
    color: colors.text.primary,
    flex: 1,
  },
  taskLabelDone: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    ...typography.label.small,
    color: colors.text.tertiary,
  },
});
