import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput as RNTextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from '../../components/common/Text';
import GlassIconButton from '../../components/common/GlassIconButton';
import ChunkyButton from '../../components/common/ChunkyButton';
import BottomSheet from '../../components/common/BottomSheet';
import GoalIconPicker from './GoalIconPicker';
import { GoalRepeatOptions, GoalTimeOptions } from './GoalScheduleOptions';
import Icon from '../../components/common/icons/Icon';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import {
  DEFAULT_SELF_CARE_GOAL_ICON,
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  normalizeSelfCareGoalTitle,
  selfCareGoalDaypartLabel,
  selfCareGoalRecurrenceLabel,
  type SelfCareGoalRecurrence,
} from './domain/selfCareGoal';
import {
  GOAL_SUGGESTION_CATEGORIES,
  type GoalSuggestion,
} from './goalSuggestions';
import type { SelfCareGoalDraft } from '../../services/selfCare/selfCareService';
import type { IconName } from '../../components/common/icons/paths';

const CLOSE_SIZE = 44;
const BADGE_SIZE = 64;
const BADGE_ICON_SIZE = 32;
const SAVE_MIN_HEIGHT = 48;
const SUGGESTION_ICON_SIZE = 24;
const ROW_BADGE_SIZE = 32;
const ROW_ICON_SIZE = 18;
// The shelf runs to the bottom of the screen, so the tabs sit clear of the home
// indicator rather than on top of it — they are a control, not chrome.
const TABS_LIFT = spacing.lg;
// Deep enough that a suggestion row dissolves over most of its own height.
const SHELF_FADE_HEIGHT = 56;
// The top fade is shallower: it doubles as the gap under the overline, and a
// 56pt one there would push the shelf away from the label that names it.
const SHELF_FADE_TOP_HEIGHT = 32;

const FIRST_CATEGORY = GOAL_SUGGESTION_CATEGORIES[0];

/** What the shelf under the card is showing. */
type ShelfMode = 'suggestions' | 'icon';

/** Which field the options sheet is open on, if any. */
type ScheduleField = 'time' | 'repeat';

const SCHEDULE_TITLE: Record<ScheduleField, string> = {
  time: 'Time of day',
  repeat: 'Repeat',
};

/**
 * What a to-do repeats on when nothing is chosen. The same default the column
 * carries, so a to-do written without opening the row behaves the way one
 * written before the row existed does.
 */
const DEFAULT_RECURRENCE: SelfCareGoalRecurrence = 'daily';

/**
 * A field on the goal card, showing the answer it currently holds. Tapping one
 * swaps the shelf below to its choices, so the card stays the size it is and
 * the answer never moves while it is being picked.
 */
function CardRow({
  icon,
  badgeTint,
  badgeColor,
  label,
  value,
  open,
  onPress,
}: {
  icon: IconName;
  badgeTint: string;
  badgeColor: string;
  label: string;
  value: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.cardRow, pressed && pressable.surface]}
    >
      <View style={[styles.rowBadge, { backgroundColor: badgeTint }]}>
        <Icon name={icon} size={ROW_ICON_SIZE} color={badgeColor} />
      </View>
      <Text style={[styles.rowValue, open && styles.rowValueOpen]}>
        {value}
      </Text>
    </Pressable>
  );
}

interface AddGoalSheetProps {
  visible: boolean;
  onClose: () => void;
  /** already normalized — the sheet will not call this with an empty title */
  onSubmit: (draft: SelfCareGoalDraft) => void;
  pending: boolean;
  error: unknown;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

/**
 * The way onto the list: a full-height sheet on its own color block, with the
 * empty goal card at the top and a shelf of suggestions under it. Writing a
 * to-do is the whole screen for as long as it takes, rather than a row that
 * unfolds inside the list and pushes the day's journey around.
 */
export default function AddGoalSheet({
  visible,
  onClose,
  onSubmit,
  pending,
  error,
}: AddGoalSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<RNTextInput>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<IconName>(DEFAULT_SELF_CARE_GOAL_ICON);
  const [recurrence, setRecurrence] = useState<SelfCareGoalRecurrence>(
    DEFAULT_RECURRENCE,
  );
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(FIRST_CATEGORY.id);
  // Every picker takes over the shelf rather than opening a layer above it: the
  // thing being chosen sits on the card right there, so the choice has to stay
  // visible next to what it changes.
  const [shelf, setShelf] = useState<ShelfMode>('suggestions');
  const [editingField, setEditingField] = useState<ScheduleField | null>(null);

  // The sheet is a fresh sheet every time it opens: the draft and the shelf it
  // was left on belong to the goal that was written, not to the next one.
  useEffect(() => {
    if (visible) return;
    setTitle('');
    setIcon(DEFAULT_SELF_CARE_GOAL_ICON);
    setRecurrence(DEFAULT_RECURRENCE);
    setScheduledTime(null);
    setCategoryId(FIRST_CATEGORY.id);
    setShelf('suggestions');
    setEditingField(null);
  }, [visible]);

  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  const category =
    GOAL_SUGGESTION_CATEGORIES.find((entry) => entry.id === categoryId) ??
    FIRST_CATEGORY;

  const save = () => {
    if (normalizedTitle == null || pending) return;
    triggerTapHaptic();
    onSubmit({ title: normalizedTitle, icon, recurrence, scheduledTime });
  };

  const openShelf = (mode: ShelfMode) => {
    triggerTapHaptic();
    setShelf((current) => (current === mode ? 'suggestions' : mode));
  };

  const openField = (field: ScheduleField) => {
    triggerTapHaptic();
    setEditingField(field);
  };

  // A suggestion fills the card rather than saving straight to the list, so the
  // line stays yours to edit — and its hour and repeat stay yours to set —
  // before it becomes a to-do. Its icon comes with it, and the badge above
  // stays tappable if you want a different one.
  const chooseSuggestion = (suggestion: GoalSuggestion) => {
    triggerTapHaptic();
    setTitle(suggestion.title);
    setIcon(suggestion.icon);
    setShelf('suggestions');
    inputRef.current?.focus();
  };

  const chooseIcon = (choice: IconName) => {
    triggerTapHaptic();
    setIcon(choice);
    setShelf('suggestions');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <StatusBar style="light" />
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <GlassIconButton
            accessibilityLabel="Close"
            size={CLOSE_SIZE}
            onPress={onClose}
          >
            <Icon name="close" size={20} color={colors.text.inverse} />
          </GlassIconButton>
        </View>

        <View style={[card.base, card.shadow, styles.card]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              shelf === 'icon' ? 'Close the icon picker' : 'Change the icon'
            }
            onPress={() => openShelf('icon')}
            style={({ pressed }) => [
              styles.badge,
              shelf === 'icon' && styles.badgePicking,
              pressed && pressable.surface,
            ]}
          >
            <Icon
              name={icon}
              size={BADGE_ICON_SIZE}
              color={colors.primary.blue600}
            />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={title}
            onChangeText={setTitle}
            multiline
            submitBehavior="blurAndSubmit"
            onSubmitEditing={save}
            returnKeyType="done"
            maxLength={MAX_SELF_CARE_GOAL_TITLE_LENGTH}
            placeholder="Enter a new goal…"
            placeholderTextColor={colors.text.tertiary}
            editable={!pending}
            style={styles.input}
            accessibilityLabel="Goal"
          />
          {/* The hour and the repeat sit on the card from the first moment,
              carrying their defaults, so a to-do is never saved under settings
              that were never shown. */}
          <View style={styles.cardRows}>
            <CardRow
              icon="clock"
              badgeTint={colors.surface.teal}
              badgeColor={colors.playful.teal.ink}
              label="Time of day"
              value={selfCareGoalDaypartLabel(scheduledTime)}
              open={editingField === 'time'}
              onPress={() => openField('time')}
            />
            <CardRow
              icon="calendar"
              badgeTint={colors.surface.sky}
              badgeColor={colors.playful.sky.ink}
              label="Repeat"
              value={selfCareGoalRecurrenceLabel(recurrence)}
              open={editingField === 'repeat'}
              onPress={() => openField('repeat')}
            />
          </View>

          {normalizedTitle == null ? null : (
            <ChunkyButton
              shape="card"
              label="Add to my day"
              disabled={pending}
              loading={pending}
              haptic="tap"
              minHeight={SAVE_MIN_HEIGHT}
              onPress={save}
            />
          )}
        </View>

        {error == null ? null : (
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage(error)}
          </Text>
        )}

        <Text style={styles.overline}>
          {shelf === 'icon' ? 'Choose an icon' : 'Suggestions'}
        </Text>

        <View style={styles.shelf}>
          <ScrollView
            contentContainerStyle={styles.shelfContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {shelf === 'icon' ? (
              <GoalIconPicker selected={icon} onSelect={chooseIcon} />
            ) : (
              category.suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.title}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion.title}
                  onPress={() => chooseSuggestion(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && pressable.surface,
                  ]}
                >
                  <Icon
                    name={suggestion.icon}
                    size={SUGGESTION_ICON_SIZE}
                    color={colors.text.inverse}
                  />
                  <Text style={styles.suggestionLabel}>{suggestion.title}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
          <LinearGradient
            pointerEvents="none"
            colors={[colors.playful.sky.base, colors.blockFade.sky]}
            style={styles.shelfFadeTop}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[colors.blockFade.sky, colors.playful.sky.base]}
            style={styles.shelfFade}
          />
        </View>

        {shelf !== 'suggestions' ? null : (
        <View style={{ paddingBottom: insets.bottom + TABS_LIFT }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.tabs}
          >
            {GOAL_SUGGESTION_CATEGORIES.map((entry) => {
              const selected = entry.id === category.id;
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    triggerTapHaptic();
                    setCategoryId(entry.id);
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    selected && styles.tabSelected,
                    pressed && pressable.subtle,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      selected && styles.tabLabelSelected,
                    ]}
                  >
                    {entry.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        )}

        {/* The same tiles the edit sheet opens, on a sheet of their own rather
            than in the shelf: the answer is a grid, and the shelf is a column
            of lines. Picking one leaves the sheet open — the tile takes the
            selected border and stays there to be changed again, so the choice
            is confirmed in place rather than by the sheet vanishing. */}
        <BottomSheet
          visible={editingField != null}
          onClose={() => setEditingField(null)}
          title={editingField == null ? '' : SCHEDULE_TITLE[editingField]}
        >
          {editingField === 'repeat' ? (
            <GoalRepeatOptions
              recurrence={recurrence}
              onSelect={setRecurrence}
            />
          ) : (
            <GoalTimeOptions
              scheduledTime={scheduledTime}
              onSelect={setScheduledTime}
            />
          )}
        </BottomSheet>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.playful.sky.base,
    gap: spacing.md,
  },
  topBar: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'flex-start',
  },
  card: {
    marginHorizontal: padding.screen.horizontal,
    borderRadius: radius.sheet,
    padding: spacing.mdPlus,
    gap: spacing.md,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.cardSoft,
  },
  badgePicking: {
    backgroundColor: colors.background.accentSoft,
  },
  // Sized like a headline, not a form field: the goal is the only thing on the
  // card, so it is written at the size it will be remembered at.
  input: {
    ...typography.title.title2,
    lineHeight: wrappedLineHeight(typography.title.title2.fontSize),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    padding: 0,
    minHeight: 34,
  },
  error: {
    ...typography.body.small,
    marginHorizontal: padding.screen.horizontal,
    color: colors.error[100],
  },
  overline: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    marginHorizontal: padding.screen.horizontal,
    color: colors.onBlock.textMuted,
  },
  shelf: {
    flex: 1,
    // The top fade is the gap under the overline, so the screen's own gap is
    // taken back rather than stacked on top of it.
    marginTop: -spacing.md,
  },
  // Both fades are clear of the resting list: the padding puts the first and
  // last rows exactly where each gradient runs out, so nothing is dimmed until
  // it is actually scrolling under one.
  shelfContent: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: SHELF_FADE_TOP_HEIGHT,
    paddingBottom: SHELF_FADE_HEIGHT,
    gap: spacing.sm,
  },
  // The shelf runs out into the block at both ends rather than stopping on an
  // edge, so the overline above and the tabs below read as the ends of the list
  // instead of lids clamped on it.
  shelfFadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SHELF_FADE_TOP_HEIGHT,
  },
  shelfFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHELF_FADE_HEIGHT,
  },
  // The rows sit tight under the title with no divider between them: they are
  // the goal's own settings, not a separate list stacked on the card.
  cardRows: {
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  rowBadge: {
    width: ROW_BADGE_SIZE,
    height: ROW_BADGE_SIZE,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowValue: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    flex: 1,
    color: colors.text.tertiary,
  },
  // The open row is the one the shelf below is answering, so it takes the ink
  // the answer will land in.
  rowValueOpen: {
    color: colors.text.primary,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.onBlock.fill,
  },
  suggestionLabel: {
    ...typography.heading.heading1,
    lineHeight: wrappedLineHeight(typography.heading.heading1.fontSize),
    fontFamily: fonts.semibold,
    flex: 1,
    color: colors.text.inverse,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: padding.screen.horizontal - spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  tabSelected: {
    backgroundColor: colors.onBlock.fillActive,
  },
  tabLabel: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    color: colors.onBlock.textMuted,
  },
  tabLabelSelected: {
    color: colors.text.inverse,
  },
});
