import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
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
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import StreakFlame from '../../components/common/StreakFlame';
import ChunkyButton from '../../components/common/ChunkyButton';
import Confetti from '../../components/common/Confetti';
import { Rise } from '../../components/common/Reveal';
import { getRoomDay } from './roomDays';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { DAILIES_PER_DAY } from '../../lib/dailies';
import { radius } from '../../theme/card';
import { duration, easing, spring } from '../../theme/motion';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { PlayfulHue } from '../exercise/guidedBreathing/categoryPalette';
import type { DailyCompleteState } from './useDailyCompleteSnapshot';

export type { DailyCompleteState } from './useDailyCompleteSnapshot';

/**
 * The celebration is always night, never the exercise's category colour.
 *
 * The flame is the hero here and it is orange, which glows against a deep blue
 * and dies against a warm or green block. The screens that cover themselves
 * while this sheet plays paint that cover in this same colour.
 */
export const CELEBRATION_HUE: PlayfulHue = colors.playful.night;

// Sized off the screen rather than fixed, so it stays the hero on a Pro Max
// without crowding the title off an SE.
const FLAME_MAX = 320;
const FLAME_WIDTH_RATIO = 0.74;
const FLICKER_MS = 1500;
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
  title: 220,
  subtitle: 330,
  progress: 480,
  cta: 640,
} as const;

const CONFETTI_MS = 140;

// The bar fills only once it has finished fading in. Starting with its `Rise`
// meant the fill — which is deliberately front-loaded — was all but complete by
// the time it became visible, so it looked like it had never moved.
const BAR_FILL_DELAY = BEAT.progress + duration.slow;

const BAR_FILL_END = BAR_FILL_DELAY + duration.fill;

interface DailyCompleteSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
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
  title,
  subtitle,
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
  const reducedMotion = useReducedMotion();
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
  const remaining = Math.max(0, DAILIES_PER_DAY - done);

  // On the third daily the screen stops being about the session and starts
  // being about the thing they just earned, so the copy changes with it.
  const headline = unlocked ? 'All 3 dailies done!' : title;
  const supporting = unlocked ? 'You earned a new decoration' : subtitle;

  useEffect(() => {
    if (!visible) {
      offset.value = 0;
      badge.value = 0;
      closing.current = false;
      setPresented(false);
      return;
    }

    if (!presented || reducedMotion) return;

    if (unlocked) {
      badge.value = withDelay(
        BAR_FILL_END,
        withSequence(
          withTiming(1, { duration: 160 }),
          withSpring(0.6, spring.bounce),
        ),
      );
    }
  }, [badge, offset, presented, reducedMotion, unlocked, visible]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    onExitStart?.();
    triggerTapHaptic();
    if (reducedMotion) {
      onDismiss();
      return;
    }
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
              backgroundColor: CELEBRATION_HUE.base,
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
            sheetStyle,
          ]}
        >
          <>
            {reducedMotion ? null : (
              <Confetti
                pieceColors={[colors.text.inverse, colors.orange[300]]}
                startDelayMs={CONFETTI_MS}
                origin="fall"
                pieceCount={24}
                active={presented}
              />
            )}

            <View style={styles.center}>
              <Flame
                size={flameSize}
                delay={BEAT.flame}
                active={presented}
                reducedMotion={reducedMotion}
              />
              <TypedTitle
                text={headline}
                delay={BEAT.title}
                active={presented}
                reducedMotion={reducedMotion}
              />
              <SheetRise
                delay={BEAT.subtitle}
                when={presented}
                reducedMotion={reducedMotion}
              >
                <Text style={styles.subtitle}>{supporting}</Text>
              </SheetRise>
            </View>

            {showBar ? (
              <SheetRise
                delay={BEAT.progress}
                when={presented}
                reducedMotion={reducedMotion}
                style={styles.progressBlock}
              >
                <View style={styles.barRow}>
                  <ProgressBar
                    progress={
                      reducedMotion || presented
                        ? done / DAILIES_PER_DAY
                        : barFrom
                    }
                    from={reducedMotion ? done / DAILIES_PER_DAY : barFrom}
                    delay={reducedMotion ? 0 : BAR_FILL_DELAY}
                    height={BAR_HEIGHT}
                    trackColor={colors.onBlock.fill}
                    fillColor={colors.text.inverse}
                    onFillStart={reducedMotion ? undefined : impactLight}
                    onFillEnd={
                      reducedMotion ? undefined : () => settleHaptic(unlocked)
                    }
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
                  {!unlocked
                    ? `${remaining} more to earn today's decoration`
                    : day == null
                      ? 'Ready to place'
                      : `Ready for the ${day.note}`}
                </Text>
              </SheetRise>
            ) : null}

            <SheetRise
              delay={BEAT.cta}
              when={presented}
              reducedMotion={reducedMotion}
              style={styles.ctaBlock}
            >
              {unlocked && rewardReady ? (
                <SheetButton
                  label="Choose your decoration"
                  onPress={choosePiece}
                />
              ) : (
                <SheetButton label="Continue" onPress={close} />
              )}
            </SheetRise>
          </>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(DailyCompleteSheet);

/**
 * The flame.
 *
 * `StreakFlame` at hero size, swaying and swelling on a slow loop. The icon
 * fonts' flames are one flat colour and read as a logo blown up to 260pt; this
 * one is drawn as nested shapes for exactly this screen.
 */
function Flame({
  size,
  delay,
  active,
  reducedMotion,
}: {
  size: number;
  delay: number;
  active: boolean;
  reducedMotion: boolean;
}) {
  const enter = useSharedValue(0);
  const flicker = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(enter);
      cancelAnimation(flicker);
      enter.value = 0;
      flicker.value = 0;
      return;
    }

    if (reducedMotion) {
      enter.value = 1;
      flicker.value = 0;
      return;
    }

    enter.value = withDelay(delay, withSpring(1, spring.pop));
    flicker.value = withDelay(
      delay + duration.slower,
      withRepeat(
        withTiming(1, { duration: FLICKER_MS, easing: easing.breathe }),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(enter);
      cancelAnimation(flicker);
    };
  }, [active, delay, enter, flicker, reducedMotion]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.4], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(enter.value, [0, 1], [0.7, 1]) },
      { scaleY: interpolate(flicker.value, [0, 1], [0.98, 1.05]) },
    ],
  }));

  return (
    <Animated.View style={[styles.flameWrap, animated]}>
      <StreakFlame size={size} />
    </Animated.View>
  );
}

function SheetRise({
  children,
  delay,
  when,
  reducedMotion,
  style,
}: {
  children: ReactNode;
  delay: number;
  when: boolean;
  reducedMotion: boolean;
  style?: Parameters<typeof Rise>[0]['style'];
}) {
  if (reducedMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Rise delay={delay} when={when} style={style}>
      {children}
    </Rise>
  );
}

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
function TypedTitle({
  text,
  delay,
  active,
  reducedMotion,
}: {
  text: string;
  delay: number;
  active: boolean;
  reducedMotion: boolean;
}) {
  // A fixed window would put the characters of a long name closer together than
  // a frame, and gaps that do not divide evenly into frames read as stuttering
  // no matter how smoothly each one fades.
  const step = Math.max(TYPE_MIN_STEP, duration.type / Math.max(1, text.length));

  let index = 0;

  if (reducedMotion) {
    return (
      <View style={styles.titleBlock}>
        <Animated.Text
          allowFontScaling={false}
          style={[styles.title, { opacity: active ? 1 : 0 }]}
        >
          {text}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.titleBlock}>
      {(text.match(/\S+\s*/g) ?? [text]).map((word, wordIndex) => (
        <View key={wordIndex} style={styles.titleWord}>
          {[...word].map((char, charIndex) => (
            <TypedChar
              key={charIndex}
              char={char}
              delay={delay + index++ * step}
              active={active}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function TypedChar({
  char,
  delay,
  active,
}: {
  char: string;
  delay: number;
  active: boolean;
}) {
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(enter);
      enter.value = 0;
      return;
    }

    enter.value = withDelay(
      delay,
      withTiming(1, { duration: duration.type, easing: easing.enter }),
    );

    return () => cancelAnimation(enter);
  }, [active, delay, enter]);

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
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <ChunkyButton
      label={label}
      shape="card"
      tone={{
        face: colors.text.inverse,
        lip: CELEBRATION_HUE.ink,
        label: CELEBRATION_HUE.ink,
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
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    // The headline is the largest type in the app and it is centred, so it can
    // run wider than the screen margin without ever touching an edge.
    marginHorizontal: -spacing.sm,
  },
  flameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBlock: {
    alignSelf: 'stretch',
  },
  titleBlock: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  titleWord: {
    flexDirection: 'row',
  },
  title: {
    ...typography.display.display1,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.title.title3,
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
