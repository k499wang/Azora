import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, TextInput } from '../../components/common/Text';
import SlideUpSheet from '../../components/common/SlideUpSheet';
import ChunkyButton from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import Icon from '../../components/common/icons/Icon';
import Collapsible, {
  COLLAPSE_TIMING,
} from '../../components/common/Collapsible';
import GoalIconPicker from './GoalIconPicker';
import { GoalRepeatOptions, GoalTimeOptions } from './GoalScheduleOptions';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { IconName } from '../../components/common/icons/paths';
import {
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  normalizeSelfCareGoalTitle,
  selfCareGoalDaypartLabel,
  selfCareGoalRecurrenceLabel,
  type SelfCareGoal,
  type SelfCareGoalRecurrence,
} from './domain/selfCareGoal';

const BADGE_SIZE = 72;
const BADGE_ICON_SIZE = 38;
const PENCIL_BADGE_SIZE = 28;
const ROW_BADGE_SIZE = 36;
const ROW_ICON_SIZE = 20;
const SAVE_MIN_HEIGHT = 52;
const SAVE_MIN_WIDTH = 156;

/** which card is open; only one at a time, so the form never grows twice over */
type OpenSection = 'icon' | 'time' | 'repeat' | null;

interface GoalEditSheetProps {
  /** the to-do being edited; `null` closes the sheet */
  goal: SelfCareGoal | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSave: (edit: {
    title: string;
    icon: IconName;
    recurrence: SelfCareGoalRecurrence;
    scheduledTime: string | null;
  }) => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

/**
 * A field that opens where it stands. The chevron points down at the choices it
 * is holding, so the answer arrives on the same card as the question rather
 * than on a picker stacked over the form.
 */
function ExpandingRow({
  icon,
  badgeTint,
  badgeColor,
  label,
  value,
  open,
  onToggle,
  children,
}: {
  icon: IconName;
  badgeTint: string;
  badgeColor: string;
  label: string;
  /** the current answer; every field has one, so the caps label always shows */
  value: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, COLLAPSE_TIMING);
  }, [open, turn]);
  // The arrow turns over on the same curve the card opens on, so the chevron
  // and the drawer under it are one movement rather than two.
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(turn.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  return (
    <View style={[card.base, styles.sectionCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}, ${value}`}
        onPress={() => {
          triggerTapHaptic();
          onToggle();
        }}
        style={({ pressed }) => [styles.row, pressed && pressable.surface]}
      >
        <View style={[styles.rowBadge, { backgroundColor: badgeTint }]}>
          <Icon name={icon} size={ROW_ICON_SIZE} color={badgeColor} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowOverline}>{label}</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size={20} color={colors.text.tertiary} />
        </Animated.View>
      </Pressable>
      <Collapsible open={open} contentStyle={styles.options}>
        {children}
      </Collapsible>
    </View>
  );
}

/**
 * Editing a to-do, one field per card. A sheet of its own rather than a mode on
 * the detail sheet: the two are different shapes — one is three buttons, this
 * one is a form — and growing one into the other under the finger reads as the
 * sheet lurching rather than as a screen you moved to.
 */
export default function GoalEditSheet({
  goal,
  pending,
  error,
  onClose,
  onSave,
}: GoalEditSheetProps) {
  const lastGoal = useRef<SelfCareGoal | null>(null);
  if (goal != null) lastGoal.current = goal;
  const shown = goal ?? lastGoal.current;

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<IconName>('sparkle');
  const [recurrence, setRecurrence] = useState<SelfCareGoalRecurrence>('daily');
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenSection>(null);

  // Loaded from the to-do each time the sheet opens, so it always starts from
  // what is saved rather than from the last thing that was edited.
  useEffect(() => {
    if (goal == null) {
      setOpen(null);
      return;
    }
    setTitle(goal.title);
    setIcon(goal.icon);
    setRecurrence(goal.recurrence);
    setScheduledTime(goal.scheduledTime);
    setOpen(null);
  }, [goal]);

  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  const canSave = normalizedTitle != null && !pending;

  const toggle = (section: Exclude<OpenSection, null>) =>
    setOpen((current) => (current === section ? null : section));

  const save = () => {
    if (normalizedTitle == null || pending) return;
    onSave({ title: normalizedTitle, icon, recurrence, scheduledTime });
  };

  return (
    <SlideUpSheet
      visible={goal != null}
      onClose={onClose}
      sheetStyle={styles.sheet}
      fullHeight
    >
      {shown == null ? null : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.body}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  open === 'icon' ? 'Close the icon picker' : 'Change the icon'
                }
                onPress={() => {
                  triggerTapHaptic();
                  toggle('icon');
                }}
                style={({ pressed }) => [
                  styles.badge,
                  open === 'icon' && styles.badgeOpen,
                  pressed && pressable.surface,
                ]}
              >
                <Icon
                  name={icon}
                  size={BADGE_ICON_SIZE}
                  color={colors.primary.blue600}
                />
                {/* Rides the badge's corner, so what changes the icon is
                    attached to the icon rather than being a row of its own. */}
                <View style={styles.pencilBadge}>
                  <Icon name="pencil" size={14} color={colors.text.secondary} />
                </View>
              </Pressable>
              <CloseButton onPress={onClose} />
            </View>

            <Collapsible open={open === 'icon'}>
              <View style={[card.base, styles.pickerCard]}>
                <GoalIconPicker
                  selected={icon}
                  tone="onCard"
                  onSelect={(next) => {
                    setIcon(next);
                    setOpen(null);
                  }}
                />
              </View>
            </Collapsible>

            <View style={[card.base, styles.titleCard]}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                multiline
                maxLength={MAX_SELF_CARE_GOAL_TITLE_LENGTH}
                placeholder="Name this to-do"
                placeholderTextColor={colors.text.tertiary}
                editable={!pending}
                style={styles.titleInput}
                accessibilityLabel="To-do name"
              />
            </View>

            <ExpandingRow
              icon="clock"
              badgeTint={colors.surface.teal}
              badgeColor={colors.playful.teal.ink}
              label="Time of day"
              value={selfCareGoalDaypartLabel(scheduledTime)}
              open={open === 'time'}
              onToggle={() => toggle('time')}
            >
              <GoalTimeOptions
                scheduledTime={scheduledTime}
                onSelect={setScheduledTime}
              />
            </ExpandingRow>

            <ExpandingRow
              icon="calendar"
              badgeTint={colors.surface.sky}
              badgeColor={colors.playful.sky.ink}
              label="Repeat"
              value={selfCareGoalRecurrenceLabel(recurrence)}
              open={open === 'repeat'}
              onToggle={() => toggle('repeat')}
            >
              <GoalRepeatOptions
                recurrence={recurrence}
                onSelect={setRecurrence}
              />
            </ExpandingRow>

            {error == null ? null : (
              <Text accessibilityRole="alert" style={styles.error}>
                {errorMessage(error)}
              </Text>
            )}
          </ScrollView>

          {/* Docked rather than scrolled past: on a sheet this tall, a Save
              that has to be scrolled to is a Save that gets missed. */}
          <View style={styles.footer}>
            <ChunkyButton
              shape="card"
              label="Save"
              disabled={!canSave}
              loading={pending}
              haptic="tap"
              minHeight={SAVE_MIN_HEIGHT}
              onPress={save}
              style={styles.save}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  // The badge and the way out share the top line, so the form starts under
  // both rather than after a row of its own.
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.large,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accentSoft,
  },
  badgeOpen: {
    backgroundColor: colors.primary.blue100,
  },
  pencilBadge: {
    position: 'absolute',
    right: -PENCIL_BADGE_SIZE / 3,
    bottom: -PENCIL_BADGE_SIZE / 4,
    width: PENCIL_BADGE_SIZE,
    height: PENCIL_BADGE_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pickerCard: {
    padding: spacing.md,
  },
  titleCard: {
    minHeight: 132,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.mdPlus,
  },
  titleInput: {
    ...typography.title.title2,
    lineHeight: wrappedLineHeight(typography.title.title2.fontSize),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    padding: 0,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBadge: {
    width: ROW_BADGE_SIZE,
    height: ROW_BADGE_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowOverline: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  rowValue: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  options: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  footer: {
    alignItems: 'flex-end',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  save: {
    alignSelf: 'flex-end',
    minWidth: SAVE_MIN_WIDTH,
  },
  error: {
    ...typography.body.small,
    color: colors.error[500],
  },
});
