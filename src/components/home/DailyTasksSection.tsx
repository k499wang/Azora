import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding, margin } from '../../theme/spacing';

const DAILY_TASKS = [
  { label: 'Morning breathing session', time: '5 min', technique: 'Box Breathing', icon: 'weather-sunny' as const },
  { label: 'Mindfulness check-in', time: '3 min', technique: 'Body Scan', icon: 'meditation' as const },
  { label: 'Evening session', time: '7 min', technique: '4-7-8 Breathing', icon: 'weather-night' as const },
];

export default function DailyTasksSection() {
  return (
    <View style={styles.dailyPlan}>
      <Text style={styles.dailyPlanTitle}>Daily Tasks</Text>
      <View style={styles.taskStack}>
        {DAILY_TASKS.map((task, i) => (
          <View key={i} style={styles.taskCard}>
            <View style={styles.taskImageArea}>
              <MaterialCommunityIcons name={task.icon} size={26} color={colors.text.inverse} />
            </View>
            <View style={styles.taskContent}>
              <Text style={styles.taskText}>{task.label}</Text>
              <View style={styles.taskMetaInline}>
                <View style={styles.taskMetaRow}>
                  <MaterialCommunityIcons name="yoga" size={14} color={colors.text.secondary} />
                  <Text style={styles.taskTechnique}>{task.technique}</Text>
                </View>
                <View style={styles.taskMetaDivider} />
                <View style={styles.taskMetaRow}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary.blue500} />
                  <Text style={styles.taskTime}>{task.time}</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardAccent}>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary.blue600} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dailyPlan: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  dailyPlanTitle: {
    ...typography.title.title2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  taskStack: {
    gap: spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  taskImageArea: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    gap: spacing.xs,
  },
  taskText: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  taskMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
  },
  taskTechnique: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  taskTime: {
    ...typography.body.xsmall,
    color: colors.primary.blue500,
  },
  cardAccent: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.background.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
