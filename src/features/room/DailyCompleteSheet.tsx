import { memo, useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import Confetti from '../../components/common/Confetti';
import { Pop, Rise } from '../../components/common/Reveal';
import { getRoomDay, getRoomDayLabel } from './roomDays';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { DAILIES_PER_DAY } from '../../lib/dailies';
import { radius } from '../../theme/card';
import { duration, easing, spring } from '../../theme/motion';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { PlayfulHue } from '../exercise/guidedBreathing/categoryPalette';
import type { DailyCompleteState } from './useDailyCompleteSnapshot';

export type { DailyCompleteState } from './useDailyCompleteSnapshot';

// Sized off the screen rather than fixed, so it stays the hero on a Pro Max
// without crowding the title off an SE.
const FLAME_MAX = 260;
const FLAME_WIDTH_RATIO = 0.62;
// Two frames at 60Hz, four at 120 — a whole number on both, which is what keeps
// the gaps between characters even.
const TYPE_MIN_STEP = 32;
const BADGE_SIZE = 38;
const BAR_HEIGHT = 12;
const FALL_MS = duration.base;

// Every element lands on its own beat, top to bottom, from the moment the
// screen appears. These used to be offset by a slide-up that no longer happens,
// which left the whole sheet sitting empty for the first half second.
const BEAT = {
  flame: 60,
  title: 200,
  subtitle: 290,
  stats: 400,
  progress: 560,
  cta: 700,
} as const;

const CONFETTI_MS = 140;

// The bar fills only once it has finished fading in. Starting with its `Rise`
// meant the fill — which is deliberately front-loaded — was all but complete by
// the time it became visible, so it looked like it had never moved.
const BAR_FILL_DELAY = BEAT.progress + duration.slow;

const BAR_FILL_END = BAR_FILL_DELAY + duration.fill;

interface DailyCompleteSheetProps {
  visible: boolean;
  /** the colour the whole screen is painted in — the exercise's category hue */
  hue: PlayfulHue;
  title: string;
  subtitle: string;
  /** the two or three headline numbers, shown as tiles */
  stats?: { label: string; value: string }[];
  /** Immutable room state captured before the animated content mounts. */
  state: DailyCompleteState;
  /** Frozen progress-bar origin, including repeat-daily behavior. */
  barFrom: number;
  /** Server-confirmed room entitlement; optimistic completion stays dismissible. */
  rewardReady?: boolean;
  /** Fires when the native Modal is visible and the entrance may begin. */
  onShow?: () => void;
  /** Fires immediately before the sheet begins its exit animation. */
  onExitStart?: () => void;
  onChoosePiece: () => void;
  onDismiss: () => void;
}

/**
 * The beat between finishing and reading your numbers.
 *
 * A full screen of one saturated colour. Nothing else in the app is a single
 * unbroken field edge to edge, which is what makes it read as an event rather
 * than another card — and it holds the whole screen so there is nothing behind
 * it competing while it plays. The results screen keeps the numbers; this
 * surface only carries the feeling.
 *
 * There is no swipe-away and no backdrop tap: the moment is short, and a screen
 * you can brush off by accident is one people will brush off by accident. It
 * leaves on a deliberate press, nothing else.
 */
function DailyCompleteSheet({
  visible,
  hue,
  title,
  subtitle,
  stats = [],
  state,
  barFrom,
  rewardReady = true,
  onShow,
  onExitStart,
  onChoosePiece,
  onDismiss,
}: DailyCompleteSheetProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const flameSize = Math.min(FLAME_MAX, width * FLAME_WIDTH_RATIO);
  const [presented, setPresented] = useState(false);
  const closing = useRef(false);

  // Starts covering, rather than sliding up into place. Rising from off-screen
  // means the results screen is visible behind it for the length of the
  // animation, which reads as the wrong screen flashing before the right one.
  // The contents animate in instead; only leaving is a slide.
  const offset = useSharedValue(0);
  const badge = useSharedValue(0);
  const { done, unlocked, showBar } = state;

  const day = state.nextSlot == null ? null : getRoomDay(state.nextSlot);
  const pieceLabel =
    state.nextSlot == null ? null : getRoomDayLabel(state.nextSlot);
  const remaining = Math.max(0, DAILIES_PER_DAY - done);

  // On the third daily the screen stops being about the session and starts
  // being about the thing they just earned, so the copy changes with it.
  const headline = unlocked ? 'All 3 dailies done!' : title;
  const supporting = unlocked
    ? pieceLabel == null
      ? "You earned today's decoration"
      : `You earned a new ${pieceLabel}`
    : subtitle;

  useEffect(() => {
    if (!visible) {
      offset.value = 0;
      badge.value = 0;
      closing.current = false;
      setPresented(false);
      return;
    }

    if (!presented) return;

    if (unlocked) {
      badge.value = withDelay(
        BAR_FILL_END,
        withSequence(
          withTiming(1, { duration: 160 }),
          withSpring(0.6, spring.bounce),
        ),
      );
    }
  }, [badge, offset, presented, unlocked, visible]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    onExitStart?.();
    triggerTapHaptic();
    offset.value = withTiming(
      height,
      { duration: FALL_MS, easing: easing.exit },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.value, [0, height], [1, 0], 'clamp'),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + badge.value * 0.35 }],
  }));

  const choosePiece = () => {
    if (closing.current) return;
    closing.current = true;
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onChoosePiece();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      // The rise is driven here, so the platform must not animate the modal
      // underneath it.
      animationType="none"
      statusBarTranslucent
      // Android's back gesture must not dismiss this either.
      onRequestClose={noop}
      onShow={() => {
        setPresented(true);
        onShow?.();
      }}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: hue.base,
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
            sheetStyle,
          ]}
        >
          {presented ? (
            <>
              <View style={styles.center}>
                <Confetti
                  pieceColors={[colors.text.inverse, hue.soft]}
                  startDelayMs={CONFETTI_MS}
                />
                <Pop delay={BEAT.flame}>
                  <Icon name="streakFilled" size={flameSize} color={hue.soft} />
                </Pop>
                <TypedTitle text={headline} delay={BEAT.title} />
                <Rise delay={BEAT.subtitle}>
                  <Text style={styles.subtitle}>{supporting}</Text>
                </Rise>
              </View>

              {stats.length === 0 ? null : (
                <View style={styles.statRow}>
                  {stats.map((stat, index) => (
                    <Pop
                      key={stat.label}
                      delay={BEAT.stats + index * 90}
                      style={styles.statSlot}
                    >
                      <View style={styles.statTile}>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                      </View>
                    </Pop>
                  ))}
                </View>
              )}

              {showBar ? (
                <Rise delay={BEAT.progress} style={styles.progressBlock}>
                  <View style={styles.barRow}>
                    <ProgressBar
                      progress={done / DAILIES_PER_DAY}
                      from={barFrom}
                      delay={BAR_FILL_DELAY}
                      height={BAR_HEIGHT}
                      trackColor={colors.onBlock.fill}
                      fillColor={colors.text.inverse}
                      onFillStart={impactLight}
                      onFillEnd={() => settleHaptic(unlocked)}
                      style={styles.bar}
                    />
                    <Animated.View style={[styles.badge, badgeStyle]}>
                      <Icon
                        name={unlocked ? 'unlock' : 'lock'}
                        size={18}
                        color={colors.text.inverse}
                      />
                    </Animated.View>
                  </View>
                  <Text style={styles.progressLabel}>
                    {unlocked
                      ? day == null
                        ? 'Ready to place'
                        : `Ready for the ${day.note}`
                      : `${remaining} more to earn today's decoration`}
                  </Text>
                </Rise>
              ) : null}

              <Rise delay={BEAT.cta} style={styles.ctaBlock}>
                {unlocked && rewardReady ? (
                  <SheetButton
                    label="Choose your decoration"
                    hue={hue}
                    onPress={choosePiece}
                  />
                ) : (
                  <SheetButton label="Continue" hue={hue} onPress={close} />
                )}
              </Rise>
            </>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(DailyCompleteSheet);

/**
 * The headline types itself out.
 *
 * Every character is laid out from the start and fades from transparent, so the
 * line's geometry never changes and nothing below it shifts while it fills in.
 * The fade is long enough to overlap its neighbours: characters are still
 * arriving one at a time, but each one eases in rather than snapping on, which
 * is the difference between typing and flickering.
 *
 * It runs on the UI thread. The JS thread is at its busiest exactly here — the
 * modal mounting, the flame springing, twelve confetti pieces launching — and
 * anything driving this from a timer or a frame callback inherits that as
 * stutter.
 *
 * Words are grouped so the line wraps between them and never mid-word.
 */
function TypedTitle({ text, delay }: { text: string; delay: number }) {
  // A fixed window would put the characters of a long name closer together than
  // a frame, and gaps that do not divide evenly into frames read as stuttering
  // no matter how smoothly each one fades.
  const step = Math.max(TYPE_MIN_STEP, duration.type / Math.max(1, text.length));

  let index = 0;

  return (
    <View style={styles.titleBlock}>
      {(text.match(/\S+\s*/g) ?? [text]).map((word, wordIndex) => (
        <View key={wordIndex} style={styles.titleWord}>
          {[...word].map((char, charIndex) => (
            <TypedChar
              key={charIndex}
              char={char}
              delay={delay + index++ * step}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function TypedChar({ char, delay }: { char: string; delay: number }) {
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      delay,
      withTiming(1, { duration: duration.type, easing: easing.enter }),
    );

    return () => cancelAnimation(enter);
  }, [delay, enter]);

  const animated = useAnimatedStyle(() => ({ opacity: enter.value }));

  return (
    <Animated.Text allowFontScaling={false} style={[styles.title, animated]}>
      {char}
    </Animated.Text>
  );
}

/**
 * The app's chunky primary, inverted for a colour block: a white face on a lip
 * of the block's own ink, so it reads as raised against a background that is
 * already saturated.
 */
function SheetButton({
  label,
  hue,
  onPress,
}: {
  label: string;
  hue: PlayfulHue;
  onPress: () => void;
}) {
  return (
    <ChunkyButton
      label={label}
      shape="card"
      tone={{
        face: colors.text.inverse,
        lip: hue.ink,
        label: hue.ink,
      }}
      onPress={onPress}
    />
  );
}

function noop() {}

function impactLight() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function settleHaptic(unlocked: boolean) {
  if (!isHapticsEnabled()) return;

  if (unlocked) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statSlot: {
    flex: 1,
  },
  statTile: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: colors.onBlock.divider,
    backgroundColor: colors.onBlock.fill,
  },
  statLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.onBlock.textMuted,
  },
  statValue: {
    ...typography.stat.valueMedium,
    color: colors.text.inverse,
  },
  ctaBlock: {
    alignSelf: 'stretch',
  },
  titleBlock: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  titleWord: {
    flexDirection: 'row',
  },
  title: {
    ...typography.display.display2,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.onBlock.textMuted,
    textAlign: 'center',
  },
  progressBlock: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bar: {
    flex: 1,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onBlock.fill,
  },
  progressLabel: {
    ...typography.body.small,
    color: colors.onBlock.textMuted,
  },
});
