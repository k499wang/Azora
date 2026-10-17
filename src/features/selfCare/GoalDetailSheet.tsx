import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import SlideUpSheet from '../../components/common/SlideUpSheet';
import ChunkyButton, { CHUNKY_TONE_DESTRUCTIVE } from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { SelfCareGoal } from './domain/selfCareGoal';
import { taskSupport } from './domain/taskSupport';

const HELP_TILE_SIZE = 32;
const HELP_ILLUSTRATION_SIZE = 24;
const HELP_CHIP_HEIGHT = 40;
const HELP_CHIP_LIP = 4;
const HELP_CHIP_LIP_PRESSED = 2;
const BADGE_SIZE = 72;
const BADGE_ICON_SIZE = 38;
const EDIT_ICON_SIZE = 22;
const REMOVE_ICON_SIZE = 22;
const COMPLETE_ICON_SIZE = 26;
const STAR_SIZE = 22;
const COMPLETE_MIN_HEIGHT = 60;
// Shorter than Complete. The two share one stack, so size is what says which
// the sheet is for — colour alone would leave them reading as a pair.
const REMOVE_MIN_HEIGHT = 48;
/**
 * White face on the same soft line the cards sit against. The sheet's biggest
 * action, but it is still finishing a to-do rather than driving a flow, so it
 * keeps the page's white instead of taking the brand blue.
 */
const COMPLETE_TONE = {
  face: colors.background.card,
  lip: colors.border.default,
  label: colors.text.primary,
};
/** The quiet white pair beside Remove, on the same soft line as Complete. */
const EDIT_TONE = {
  face: colors.background.card,
  lip: colors.border.default,
  label: colors.text.secondary,
};

interface GoalDetailSheetProps {
  /** the to-do being looked at; `null` closes the sheet */
  goal: SelfCareGoal | null;
  busy: boolean;
  onClose: () => void;
  /** the sheet has finished animating out and is off the screen */
  onDismissed?: () => void;
  onToggleComplete: () => void;
  onToggleFeatured: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * What a to-do opens into. Everything you can do to one lives here rather than
 * on the row: the row is a line on the day's journey, and burying its actions
 * behind a long press meant they could only be found by accident.
 */
export default function GoalDetailSheet({
  goal,
  busy,
  onClose,
  onDismissed,
  onToggleComplete,
  onToggleFeatured,
  onEdit,
  onRemove,
}: GoalDetailSheetProps) {
  // The sheet animates out after the goal is let go of, so it keeps drawing the
  // last one it had rather than emptying as it leaves.
  const lastGoal = useRef<SelfCareGoal | null>(null);
  if (goal != null) lastGoal.current = goal;
  const shown = goal ?? lastGoal.current;

  return (
    <SlideUpSheet
      visible={goal != null}
      onClose={onClose}
      onDismissed={onDismissed}
      sheetStyle={styles.sheet}
    >
      {shown == null ? null : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.cardWrap}>
            <View style={[card.base, card.shadow, styles.card]}>
              <Text style={styles.title}>{shown.title}</Text>
              <View style={styles.divider} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: shown.featuredToday }}
                disabled={busy}
                onPress={() => {
                  triggerTapHaptic();
                  onToggleFeatured();
                }}
                style={({ pressed }) => [
                  styles.featureRow,
                  pressed && pressable.subtle,
                ]}
              >
                <Icon
                  bold
                  name={shown.featuredToday ? 'star' : 'star-outline'}
                  size={STAR_SIZE}
                  color={
                    shown.featuredToday
                      ? colors.reward.gold
                      : colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.featureLabel,
                    shown.featuredToday && styles.featureLabelOn,
                  ]}
                >
                  {shown.featuredToday
                    ? 'Task of the day'
                    : 'Set as task of the day'}
                </Text>
              </Pressable>
            </View>
            {/* Drawn after the card so it sits over it on both platforms — a
                z-index would only settle it on one. */}
            <View pointerEvents="none" style={styles.badgeSlot}>
              <View style={styles.badge}>
                <TaskIllustration name={shown.icon} size={BADGE_ICON_SIZE} />
              </View>
            </View>
          </View>

          <TaskHelp key={`${goal?.id ?? 'closed'}:${shown.title}`} title={shown.title} />

          {/* The two secondary actions share a line, so the stack stays two
              steps deep rather than three buttons tall. */}
          <View style={styles.secondaryRow}>
            <ChunkyButton
              shape="card"
              tone={EDIT_TONE}
              label="Edit"
              disabled={busy}
              haptic="tap"
              minHeight={REMOVE_MIN_HEIGHT}
              onPress={onEdit}
              style={styles.secondary}
              icon={
                <Icon
                  bold
                  name="pencil"
                  size={EDIT_ICON_SIZE}
                  color={colors.text.secondary}
                />
              }
            />
            <ChunkyButton
              shape="card"
              tone={CHUNKY_TONE_DESTRUCTIVE}
              label="Remove"
              disabled={busy}
              haptic="tap"
              minHeight={REMOVE_MIN_HEIGHT}
              onPress={onRemove}
              style={styles.secondary}
              icon={
                <Icon
                  bold
                  name="trash"
                  size={REMOVE_ICON_SIZE}
                  color={colors.error[700]}
                />
              }
            />
          </View>

          <ChunkyButton
            shape="card"
            tone={COMPLETE_TONE}
            label={shown.completedToday ? 'Mark as not done' : 'Complete'}
            disabled={busy}
            haptic="tap"
            minHeight={COMPLETE_MIN_HEIGHT}
            onPress={onToggleComplete}
            style={styles.complete}
            icon={
              <Icon
                bold
                name="check"
                size={COMPLETE_ICON_SIZE}
                color={
                  shown.completedToday
                    ? colors.text.tertiary
                    : colors.success[500]
                }
              />
            }
          />
        </ScrollView>
      )}
    </SlideUpSheet>
  );
}

function TaskHelp({ title }: { title: string }) {
  const [mode, setMode] = useState<'steps' | 'smaller' | null>(null);
  const support = taskSupport(title);
  return (
    <View style={[card.base, card.lipped, styles.helpCard]}>
      <View style={styles.helpHeader}>
        <View style={styles.helpTile}>
          <TaskIllustration name="lightbulb" size={HELP_ILLUSTRATION_SIZE} />
        </View>
        <Text style={styles.helpTitle}>Need a starting point?</Text>
      </View>
      <View style={styles.helpChips}>
        {([
          ['steps', 'Show me how'],
          ['smaller', 'Make it smaller'],
        ] as const).map(([value, label]) => {
          const open = mode === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => {
                triggerTapHaptic();
                setMode(open ? null : value);
              }}
              style={styles.helpChipSlot}
            >
              {({ pressed }) => (
                <View style={[styles.helpChip, (pressed || open) && styles.helpChipDown, open && styles.helpChipOpen]}>
                  <Text style={[styles.helpChipLabel, open && styles.helpChipLabelOpen]}>{label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {mode != null ? (
        <View accessibilityLiveRegion="polite" style={styles.helpCopy}>
          {!support.specific ? <Text style={styles.helpLead}>A way to plan your first step</Text> : null}
          {mode === 'steps'
            ? support.steps.map((step, index) => <Text key={step} style={styles.helpText}>{index + 1}. {step}</Text>)
            : <Text style={styles.helpText}>{support.smaller}</Text>}
          <Text style={styles.helpNote}>Just a suggestion. Your to-do stays the same.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexShrink: 1,
    minHeight: 0,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  helpCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  helpTile: {
    ...card.taskIcon,
    width: HELP_TILE_SIZE,
    height: HELP_TILE_SIZE,
    borderRadius: radius.small,
  },
  helpTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  helpChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helpChipSlot: {
    flex: 1,
  },
  helpChip: {
    minHeight: HELP_CHIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderBottomWidth: HELP_CHIP_LIP,
    borderColor: colors.border.subtle,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  // The lip gives up what the face drops, so the row's height never changes.
  helpChipDown: {
    marginTop: HELP_CHIP_LIP - HELP_CHIP_LIP_PRESSED,
    minHeight: HELP_CHIP_HEIGHT - (HELP_CHIP_LIP - HELP_CHIP_LIP_PRESSED),
    borderBottomWidth: HELP_CHIP_LIP_PRESSED,
  },
  helpChipOpen: {
    backgroundColor: colors.surface.selected,
    borderColor: colors.primary.blue500,
    borderBottomColor: colors.primary.blue500,
  },
  helpChipLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  helpChipLabelOpen: {
    color: colors.primary.blue500,
  },
  helpCopy: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.blue500,
  },
  helpLead: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  helpText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  helpNote: {
    ...typography.body.xsmall,
    color: colors.text.tertiary,
  },
  sheet: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  // Leaves room above the card for the half of the badge that overhangs it.
  cardWrap: {
    marginTop: BADGE_SIZE / 2,
  },
  card: {
    borderRadius: radius.sheet,
    paddingTop: BADGE_SIZE / 2 + spacing.md,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.mdPlus,
  },
  badgeSlot: {
    position: 'absolute',
    top: -BADGE_SIZE / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
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
  title: {
    ...typography.title.title2,
    lineHeight: wrappedLineHeight(typography.title.title2.fontSize),
    fontFamily: fonts.semibold,
    textAlign: 'center',
    color: colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.mdPlus,
    marginHorizontal: -spacing.mdPlus,
    backgroundColor: colors.border.subtle,
  },
  featureRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  featureLabel: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  featureLabelOn: {
    color: colors.text.primary,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondary: {
    flex: 1,
  },
  // Kept clear of Remove, so the destructive button and the one everyone is
  // reaching for are not neighbours under the same thumb.
  complete: {
    marginTop: spacing.sm,
  },
});
