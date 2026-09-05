import { useEffect, useMemo, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { pauseSessionReplay } from '../../services/analytics/sessionReplay';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** the binder tabs the page hangs from, above its top edge */
const TAB_COUNT = 5;
const TAB_WIDTH = 14;
const TAB_HEIGHT = 34;
/** how far each ring runs down over the paper it binds */
const TAB_OVERLAP = 14;
/** clear air above the rings, so they read as binding rather than as a border */
const TAB_HEADROOM = spacing.sm;

/**
 * The plan as a page torn off a notepad.
 *
 * The screens on either side of it hand things back on cards, and cards are how
 * this app states facts. A plan is not a fact — it is a list someone wrote for
 * you — so it gets to be a different object: cream paper, ruled lines, hung
 * from binder tabs. Everything the plan contains lives on this one page, resets
 * and to-dos together, because they are one day rather than two features.
 */
export default function PlanNotepad({ children }: { children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.page}>{children}</View>
      {/* Drawn after the page so each ring runs over the paper's top edge the
          way a real binding does. Behind it, they stopped dead at the edge and
          read as tabs stuck on rather than rings threaded through. */}
      <View style={styles.tabs} pointerEvents="none">
        {Array.from({ length: TAB_COUNT }, (_, index) => (
          <View key={index} style={styles.tab} />
        ))}
      </View>
    </View>
  );
}

/**
 * One written line: a picture, what it is, and whatever answers it — an hour
 * for a reset, a checkbox for a to-do.
 */
export function PlanNotepadRow({
  leading,
  title,
  meta,
  trailing,
  ruled = true,
  onPress,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  anim,
}: {
  leading?: ReactNode;
  title: string;
  /** when in the day the line belongs — small, under the title */
  meta?: string;
  trailing?: ReactNode;
  /** the hairline above it — off for the first line of a section */
  ruled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'checkbox';
  accessibilityState?: { checked?: boolean };
  anim?: Animated.Value;
}) {
  const body = (
    <View style={[styles.row, ruled && styles.rowRuled]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.title}>
          {title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );

  const inner =
    onPress == null ? (
      body
    ) : (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        onPress={onPress}
      >
        {body}
      </Pressable>
    );

  if (anim == null) return inner;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      {inner}
    </Animated.View>
  );
}

/**
 * The page writing itself, one line at a time. Returns a value per row, so the
 * caller stays in charge of which row is which.
 */
export function useNotepadRowAnimations(count: number): Animated.Value[] {
  const anims = useMemo(
    () => Array.from({ length: count }, () => new Animated.Value(0)),
    [count],
  );

  useEffect(() => {
    const resumeReplay = pauseSessionReplay();
    const animation = Animated.stagger(
      55,
      anims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 420,
          delay: 320,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
      ),
    );
    animation.start(() => resumeReplay());
    return () => {
      animation.stop();
      resumeReplay();
    };
  }, [anims]);

  return anims;
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: TAB_HEADROOM,
    paddingTop: TAB_HEIGHT - TAB_OVERLAP,
  },
  tabs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  tab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: TAB_WIDTH / 2,
    borderCurve: 'continuous',
    backgroundColor: colors.playful.amber.mid,
  },
  page: {
    ...card.paper,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    borderColor: colors.playful.amber.soft,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    // clear of the rings running down over the top edge
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
  },
  // The rule belongs to the row below it, so a section is ruled between its
  // lines and never under its last one.
  rowRuled: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.playful.amber.soft,
  },
  leading: {
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  // The same grey line the to-do list on Home puts under a goal's title.
  meta: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  trailing: {
    flexShrink: 0,
  },
});
