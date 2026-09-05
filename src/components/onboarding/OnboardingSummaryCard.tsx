import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import CardSurface from '../common/CardSurface';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/**
 * The card the end of onboarding is built from: a heading line, an optional
 * second thing beside or under it, something on the right, and a sentence
 * below.
 *
 * The profile's highlights, the plan's actions and the plan's to-dos are three
 * fills of one shape — they were three hand-rolled copies of it, drifting a
 * padding at a time, until the third arrived and made the duplication real.
 * Keeping them one component is what makes the closing screens read as one
 * document rather than three designs.
 */
interface OnboardingSummaryCardProps {
  title: string;
  /** sits beside the title, in the reading colour — the thing the title is about */
  subject?: string;
  /** sits under the title, quieter — when it happens, not what it is */
  meta?: string;
  /** a picture at the head of the row */
  leading?: ReactNode;
  /** a pill, a control, a checkbox — whatever the row is answered with */
  trailing?: ReactNode;
  body?: string;
  /**
   * The row is switched off: greyed and struck through rather than removed, so
   * the choice stays visible and an accidental tap is obviously undoable.
   */
  dimmed?: boolean;
  /**
   * `accent` gives the title the plan's blue, for a card that names a thing the
   * app decided. `plain` keeps the reading colour, for a list of the user's own
   * lines, where a column of blue would shout.
   */
  tone?: 'accent' | 'plain';
  /** shape overrides for a list that has to match a surface outside onboarding */
  surfaceStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'checkbox';
  accessibilityState?: { checked?: boolean };
}

export default function OnboardingSummaryCard({
  title,
  subject,
  meta,
  leading,
  trailing,
  body,
  dimmed = false,
  tone = 'accent',
  surfaceStyle,
  onPress,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: OnboardingSummaryCardProps) {
  const content = (
    <>
      <View style={styles.header}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.heading}>
          <Text
            style={[
              styles.title,
              tone === 'plain' && styles.titlePlain,
              dimmed && styles.titleDimmed,
            ]}
          >
            {title}
          </Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        {subject ? <Text style={styles.subject}>{subject}</Text> : null}
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </>
  );

  if (onPress == null) {
    return (
      <CardSurface style={[styles.card, surfaceStyle]}>{content}</CardSurface>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <CardSurface style={[styles.card, surfaceStyle]}>{content}</CardSurface>
    </Pressable>
  );
}

/** The card's right-hand token: a time, a score, a count. */
export function OnboardingSummaryPill({
  label,
  color = colors.primary.blue600,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  leading: {
    flexShrink: 0,
  },
  heading: {
    flexShrink: 1,
    gap: 2,
  },
  // One heading size across the closing screens: the profile's cards, the plan
  // notepad's rows and the to-do list on Home all read at `body.large`, so a
  // finding and a line of the plan carry the same weight.
  title: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
    flexShrink: 1,
  },
  titlePlain: {
    color: colors.text.primary,
  },
  titleDimmed: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  subject: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    flexShrink: 1,
  },
  meta: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  trailing: {
    flexShrink: 0,
  },
  body: {
    ...typography.body.small,
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 23,
  },
  pill: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  pillText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.neutral[0],
  },
});
