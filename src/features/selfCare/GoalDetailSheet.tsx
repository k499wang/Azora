import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import SlideUpSheet from '../../components/common/SlideUpSheet';
import ChunkyButton from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { SelfCareGoal } from './domain/selfCareGoal';

const BADGE_SIZE = 72;
const BADGE_ICON_SIZE = 38;
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
/** Soft red, so the destructive action is named by colour before it is read. */
const REMOVE_TONE = {
  face: colors.error[100],
  lip: colors.error[300],
  label: colors.error[700],
};

interface GoalDetailSheetProps {
  /** the to-do being looked at; `null` closes the sheet */
  goal: SelfCareGoal | null;
  busy: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
  onToggleFeatured: () => void;
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
  onToggleComplete,
  onToggleFeatured,
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
      sheetStyle={styles.sheet}
      dragAnywhere
    >
      {shown == null ? null : (
        <>
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
                <Icon
                  name={shown.icon}
                  size={BADGE_ICON_SIZE}
                  color={colors.primary.blue600}
                />
              </View>
            </View>
          </View>

          <ChunkyButton
            shape="card"
            tone={REMOVE_TONE}
            label="Remove"
            disabled={busy}
            haptic="tap"
            minHeight={REMOVE_MIN_HEIGHT}
            onPress={onRemove}
            icon={
              <Icon
                name="trash"
                size={REMOVE_ICON_SIZE}
                color={colors.error[700]}
              />
            }
          />

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
        </>
      )}
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
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
  // Kept clear of Remove, so the destructive button and the one everyone is
  // reaching for are not neighbours under the same thumb.
  complete: {
    marginTop: spacing.sm,
  },
});
