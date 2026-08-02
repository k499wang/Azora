import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SectionHeader from '../common/SectionHeader';
import type { BreathingTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { getBackgroundImageSource } from '../../services/images/backgroundImageCache';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  formatDailyPlanTime,
  sortDailyPlanActionIdsByTime,
  type DailyPlanActionId,
} from '../../services/dailyPlan/dailyPlanScheduleCore';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../../services/dailyPlan/types';

const TIMELINE_COLUMN_WIDTH = 32;
const TIMELINE_MARKER_SIZE = 26;
const TIMELINE_RAIL_WIDTH = 6;
const TIMELINE_ROW_HEIGHT = 144;
const TASK_CONTENT_SIZE = 112;
const TIMELINE_ROW_GAP = spacing.lg;
const TIMELINE_RAIL_INSET = TIMELINE_ROW_HEIGHT / 2 + TIMELINE_MARKER_SIZE / 2;
const TIMELINE_RAIL_LEFT = TIMELINE_COLUMN_WIDTH / 2 - TIMELINE_RAIL_WIDTH / 2;
const TIMELINE_DASHES = Array.from({ length: 17 }, (_, index) => index);

interface TodaysDailiesSectionProps {
  technique: BreathingTechnique | null;
  techniqueLoading: boolean;
  sessionTime: string;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  handPickedTime: string;
  breathHoldTime: string;
  guidedExerciseCompleted: boolean;
  handPickedExerciseCompleted: boolean;
  breathHoldCompleted: boolean;
  exerciseAccessAllowed: boolean;
  onPressGuidedExercise: () => void;
  onPressHandPickedExercise: () => void;
  onPressBreathHold: () => void;
}

interface DailyTaskRowProps {
  title: string;
  scheduledTime: string;
  detailLabel: string;
  detailIcon: BreathingTechnique['icon'];
  imageSource: ImageProps['source'];
  completed: boolean;
  locked: boolean;
  loading?: boolean;
  onPress?: () => void;
}

function formatCategory(category: BreathingTechnique['category']): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function DailyTaskRow({
  title,
  scheduledTime,
  detailLabel,
  detailIcon,
  imageSource,
  completed,
  locked,
  loading = false,
  onPress,
}: DailyTaskRowProps) {
  const unavailable = onPress == null;
  const statusLabel = completed ? 'completed' : locked ? 'locked' : 'not completed';

  return (
    <Pressable
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detailLabel}, scheduled for ${scheduledTime}, ${statusLabel}`}
      accessibilityState={{ disabled: unavailable }}
      style={({ pressed }) => [styles.taskRow, pressed && styles.taskPressed]}
    >
      <View style={styles.timelineColumn} pointerEvents="none">
        <View
          style={[
            styles.statusMarker,
            completed
              ? styles.statusMarkerCompleted
              : locked
                ? styles.statusMarkerLocked
                : styles.statusMarkerActive,
          ]}
        >
          {completed || locked ? (
            <MaterialCommunityIcons
              name={completed ? 'check' : 'lock-outline'}
              size={15}
              color={colors.text.inverse}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.taskPill}>
        <View style={styles.taskCopy} pointerEvents="none">
          <Text style={styles.taskTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.metadataStack}>
            <View style={styles.metadataRow}>
              <MaterialCommunityIcons
                name={detailIcon}
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.metadataText} numberOfLines={1}>
                {detailLabel}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.metadataText} numberOfLines={1}>
                {scheduledTime}
              </Text>
            </View>
          </View>
        </View>

        <Image
          source={imageSource}
          style={[styles.taskImage, loading && styles.taskImageLoading]}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="memory-disk"
          transition={0}
        />
      </View>
    </Pressable>
  );
}

export default function TodaysDailiesSection({
  technique,
  techniqueLoading,
  sessionTime,
  handPickedTechnique,
  handPickedTechniqueLoading,
  handPickedTime,
  breathHoldTime,
  guidedExerciseCompleted,
  handPickedExerciseCompleted,
  breathHoldCompleted,
  exerciseAccessAllowed,
  onPressGuidedExercise,
  onPressHandPickedExercise,
  onPressBreathHold,
}: TodaysDailiesSectionProps) {
  const guidedLocked = !guidedExerciseCompleted && !exerciseAccessAllowed;
  const handPickedLocked =
    !handPickedExerciseCompleted && !exerciseAccessAllowed;
  const breathHoldLocked = !breathHoldCompleted && !exerciseAccessAllowed;
  const guidedTitle = technique?.name ?? 'Your breathing exercise';
  const guidedScheduledTime = formatDailyPlanTime(
    sessionTime,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.session,
  );
  const breathHoldScheduledTime = formatDailyPlanTime(
    breathHoldTime,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.checkIn,
  );
  const handPickedScheduledTime = formatDailyPlanTime(
    handPickedTime,
    DEFAULT_DAILY_PLAN_SCHEDULE.actions.handPicked,
  );
  const guidedDetail = technique == null
    ? 'Personalized for you'
    : `${formatCategory(technique.category)} breathing`;
  const guidedDetailIcon = technique?.icon ?? 'weather-windy';
  const rows: Record<DailyPlanActionId, DailyTaskRowProps> = {
    session: {
      title: guidedTitle,
      scheduledTime: guidedScheduledTime,
      detailLabel: guidedDetail,
      detailIcon: guidedDetailIcon,
      imageSource:
        technique?.backgroundImage ?? getBackgroundImageSource('dailyPlan'),
      completed: guidedExerciseCompleted,
      locked: guidedLocked,
      loading: techniqueLoading,
      onPress: technique == null ? undefined : onPressGuidedExercise,
    },
    handPicked: {
      title: handPickedTechnique?.name ?? 'Azora’s daily pick',
      scheduledTime: handPickedScheduledTime,
      detailLabel: 'Azora’s daily pick',
      detailIcon: handPickedTechnique?.icon ?? 'creation-outline',
      imageSource:
        handPickedTechnique?.backgroundImage ??
        getBackgroundImageSource('dailyPlan'),
      completed: handPickedExerciseCompleted,
      locked: handPickedLocked,
      loading: handPickedTechniqueLoading,
      onPress:
        handPickedTechnique == null ? undefined : onPressHandPickedExercise,
    },
    checkIn: {
      title: 'Daily Breathhold',
      scheduledTime: breathHoldScheduledTime,
      detailLabel: 'Daily check-in',
      detailIcon: 'timer-sand',
      imageSource: getBackgroundImageSource('dailyPlan'),
      completed: breathHoldCompleted,
      locked: breathHoldLocked,
      onPress: onPressBreathHold,
    },
  };
  const orderedActionIds = sortDailyPlanActionIdsByTime({
    session: sessionTime,
    handPicked: handPickedTime,
    checkIn: breathHoldTime,
  });

  return (
    <View style={styles.section}>
      <SectionHeader title="Today’s Dailies" />

      <View style={styles.timeline}>
        <View style={styles.timelineRail} pointerEvents="none">
          {TIMELINE_DASHES.map((dash) => (
            <View key={dash} style={styles.timelineRailDash} />
          ))}
        </View>
        {orderedActionIds.map((actionId) => (
          <DailyTaskRow key={actionId} {...rows[actionId]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  timeline: {
    position: 'relative',
    gap: TIMELINE_ROW_GAP,
  },
  timelineRail: {
    position: 'absolute',
    top: TIMELINE_RAIL_INSET,
    bottom: TIMELINE_RAIL_INSET,
    left: TIMELINE_RAIL_LEFT,
    width: TIMELINE_RAIL_WIDTH,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineRailDash: {
    width: TIMELINE_RAIL_WIDTH,
    height: 10,
    borderRadius: TIMELINE_RAIL_WIDTH / 2,
    backgroundColor: colors.border.default,
  },
  taskRow: {
    height: TIMELINE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  timelineColumn: {
    width: TIMELINE_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusMarker: {
    width: TIMELINE_MARKER_SIZE,
    height: TIMELINE_MARKER_SIZE,
    borderRadius: TIMELINE_MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMarkerActive: {
    backgroundColor: colors.primary.blue600,
  },
  statusMarkerCompleted: {
    backgroundColor: colors.success[500],
  },
  statusMarkerLocked: {
    backgroundColor: colors.neutral[400],
  },
  taskPill: {
    height: TIMELINE_ROW_HEIGHT,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  taskImage: {
    width: TASK_CONTENT_SIZE,
    height: TASK_CONTENT_SIZE,
    borderRadius: 24,
    backgroundColor: colors.background.lagoon,
  },
  taskImageLoading: {
    opacity: 0.45,
  },
  taskCopy: {
    flex: 1,
    height: TASK_CONTENT_SIZE,
    justifyContent: 'space-between',
  },
  taskTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  metadataStack: {
    gap: spacing.xs,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
});
