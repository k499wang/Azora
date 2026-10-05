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
  Easing,
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
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSurfacePresented } from './DailyRewardSurface';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import StreakFlame from '../../components/common/StreakFlame';
import GiftBoxRewardHero from './GiftBoxRewardHero';
import { decorationRewardPalette } from './decorationRewardPalette';
import ChunkyButton from '../../components/common/ChunkyButton';
import Confetti from '../../components/common/Confetti';
import { RiseUnlessReducedMotion } from '../../components/common/Reveal';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { triggerCelebrationHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { radius } from '../../theme/card';
import { duration, easing, spring } from '../../theme/motion';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { PlayfulHue } from '../exercise/guidedBreathing/categoryPalette';
import type { DailyCompleteState } from './useDailyCompleteSnapshot';

export type { DailyCompleteState } from './useDailyCompleteSnapshot';

/**
 * Celebrations and room seals share a night field. Decoration rewards add a
 * soft purple spotlight and matching picker surfaces.
 */
export const CELEBRATION_HUE: PlayfulHue = colors.playful.night;

// Sized off the screen rather than fixed, so it stays the hero on a Pro Max
// without crowding the title off an SE.
const FLAME_MAX = 320;
const FLAME_WIDTH_RATIO = 0.74;
const FLICKER_MS = 1500;
// Minimum spacing keeps neighbouring character fades distinct.
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
const CONFETTI_COLORS = [colors.text.inverse, colors.orange[300]] as const;

// The bar fills only once it has finished fading in. Starting with its `Rise`
// meant the fill — which is deliberately front-loaded — was all but complete by
// the time it became visible, so it looked like it had never moved.
const BAR_FILL_DELAY = BEAT.progress + duration.slow;

const BAR_FILL_END = BAR_FILL_DELAY + duration.fill;

interface DailyCompleteSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  /** a quieter second line under the subtitle, for the streak or the session */
  subtitleDetail?: string;
  /** Immutable room state captured before the animated content mounts. */
  state: DailyCompleteState;
  /** Frozen progress-bar origin, including repeat-daily behavior. */
  barFrom: number;
  /** Fires when the native Modal is visible and the entrance may begin. */
  onShow?: () => void;
  /**
   * Drawn inside `DailyRewardSurface` rather than presenting itself.
   *
   * The reward is one presentation from the celebration through to the piece
   * landing; see that file for why it cannot be two.
   */
  hosted?: boolean;
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
  subtitleDetail,
  state,
  barFrom,
  onShow,
  onExitStart,
  onChoosePiece,
  onDismiss,
  hosted = false,
}: DailyCompleteSheetProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const flameSize = Math.min(FLAME_MAX, width * FLAME_WIDTH_RATIO);
  const reducedMotion = useReducedMotion();
  const [ownPresented, setOwnPresented] = useState(false);
  // Hosted, the surface owns the presentation and says when it is on screen.
  const surfacePresented = useSurfacePresented();
  const presented = hosted ? surfacePresented : ownPresented;

  // `onShow` is the modal's callback when this presents itself. Hosted, the
  // surface presents and this has to report the same beat from the same fact.
  const shown = useRef(false);
  useEffect(() => {
    if (!hosted || !visible || !presented || shown.current) return;

    shown.current = true;
    onShow?.();
  }, [hosted, onShow, presented, visible]);
  const closing = useRef(false);

  // Starts covering, rather than sliding up into place. Rising from off-screen
  // means the results screen is visible behind it for the length of the
  // animation, which reads as the wrong screen flashing before the right one.
  // The contents animate in instead; only leaving is a slide.
  const offset = useSharedValue(0);
  const badge = useSharedValue(0);
  const { done, total, unlocked, showBar } = state;

  const remaining = Math.max(0, total - done);

  // Once the last thing on either list lands, the screen stops being about the
  // session and starts being about the thing they just earned, so the copy
  // changes with it.
  const headline = unlocked ? 'New decoration unlocked!' : title;
  const fieldColor = unlocked ? decorationRewardPalette.field : CELEBRATION_HUE.base;

  useEffect(() => {
    if (!visible) {
      shown.current = false;
      cancelAnimation(offset);
      cancelAnimation(badge);
      offset.value = 0;
      badge.value = 0;
      closing.current = false;
      setOwnPresented(false);
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

    return () => {
      cancelAnimation(offset);
      cancelAnimation(badge);
    };
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

  /**
   * The field behind the rising sheet, in the sheet's own colour.
   *
   * A translucent dim left the screen underneath showing through for the whole
   * rise — a room, a results page, whatever was there — so the moment began as
   * a coloured panel climbing over the app rather than as one unbroken field.
   * It reaches full within the first tenth of the travel, so the screen is the
   * celebration's colour almost immediately, and only gives it back at the very
   * end of the way out — by which point the sheet itself is off the screen and
   * there is nothing left to watch it happen behind.
   */
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      offset.value,
      [0, height * 0.92, height],
      [1, 1, 0],
      'clamp',
    ),
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

  const body = <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { backgroundColor: fieldColor }, backdropStyle]} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: fieldColor,
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
            sheetStyle,
          ]}
        >
          <>
            {reducedMotion ? null : (
              <Confetti
                pieceColors={CONFETTI_COLORS}
                startDelayMs={CONFETTI_MS}
                origin="fall"
                pieceCount={24}
                active={presented}
              />
            )}

            <View style={styles.center}>
              {unlocked ? (
                  <GiftBoxRewardHero
                    size={Math.min(340, width * 0.86, height * 0.43)}
                    delay={BEAT.flame}
                    active={presented}
                    reducedMotion={reducedMotion}
                  />
              ) : <Flame
                size={flameSize}
                delay={BEAT.flame}
                active={presented}
                reducedMotion={reducedMotion}
              />}
              {unlocked ? (
                <RiseUnlessReducedMotion delay={BEAT.title} when={presented} reducedMotion={reducedMotion}>
                  <Text style={styles.rewardTitle}>{headline}</Text>
                </RiseUnlessReducedMotion>
              ) : <TypedTitle
                text={headline}
                delay={BEAT.title}
                active={presented}
                reducedMotion={reducedMotion}
              />}
              {unlocked ? null : <RiseUnlessReducedMotion
                delay={BEAT.subtitle}
                when={presented}
                reducedMotion={reducedMotion}
              >
                <Text style={styles.subtitle}>{subtitle}</Text>
                {subtitleDetail == null ? null : (
                  <Text style={styles.subtitleDetail}>{subtitleDetail}</Text>
                )}
              </RiseUnlessReducedMotion>}
            </View>

            {showBar ? (
              <RiseUnlessReducedMotion
                delay={BEAT.progress}
                when={presented}
                reducedMotion={reducedMotion}
                style={unlocked ? styles.completedProgressBlock : styles.progressBlock}
              >
                <View style={styles.barRow}>
                  <ProgressBar
                    progress={
                      reducedMotion || presented
                        ? done / total
                        : barFrom
                    }
                    from={reducedMotion ? done / total : barFrom}
                    delay={reducedMotion ? 0 : BAR_FILL_DELAY}
                    height={unlocked ? 8 : BAR_HEIGHT}
                    trackColor={unlocked ? decorationRewardPalette.track : colors.onBlock.fill}
                    fillColor={unlocked ? decorationRewardPalette.accent : colors.text.inverse}
                    onFillStart={reducedMotion ? undefined : impactLight}
                    onFillEnd={
                      reducedMotion ? undefined : () => settleHaptic(unlocked)
                    }
                    style={styles.bar}
                  />
                  <Animated.View style={[styles.badge, unlocked && styles.rewardBadge, badgeStyle]}>
                    <Icon
                      name={unlocked ? 'unlock' : 'lock'}
                      size={18}
                      color={unlocked ? decorationRewardPalette.ink : colors.text.inverse}
                    />
                  </Animated.View>
                </View>
                <Text style={[styles.progressLabel, unlocked && styles.completedProgressLabel]}>
                  {!unlocked
                    ? `${remaining} more to earn today's decoration`
                    : `${done} of ${total} activities complete`}
                </Text>
              </RiseUnlessReducedMotion>
            ) : null}

            <RiseUnlessReducedMotion
              delay={BEAT.cta}
              when={presented}
              reducedMotion={reducedMotion}
              style={styles.ctaBlock}
            >
              {/* No waiting on the server here: the flow keeps its picks shut
                  until the claim lands. Waiting showed "Continue" under a
                  sheet that had just said the piece was unlocked. */}
              {unlocked ? (
                <SheetButton
                    label="Choose your decoration"
                    reward
                  onPress={choosePiece}
                />
              ) : (
                <SheetButton label="Continue" onPress={close} />
              )}
            </RiseUnlessReducedMotion>
          </>
        </Animated.View>
  </View>;

  if (hosted) {
    return body;
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
        setOwnPresented(true);
        onShow?.();
      }}
    >
      {body}
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

/**
 * The headline types itself out.
 *
 * Every character is laid out from the start and fades from transparent, so the
 * line's geometry never changes and nothing below it shifts while it fills in.
 * The fade is long enough to overlap its neighbours: characters are still
 * arriving one at a time, but each one eases in rather than snapping on, which
 * is the difference between typing and flickering.
 *
 * One UI-thread clock drives every character, avoiding a separate delayed
 * animation and effect per letter during the presentation commit.
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
  const step = Math.max(TYPE_MIN_STEP, duration.type / Math.max(1, text.length));
  const elapsed = useSharedValue(0);
  const totalMs = Math.max(0, [...text].length - 1) * step + duration.type;

  useEffect(() => {
    cancelAnimation(elapsed);
    elapsed.value = 0;
    if (!active || reducedMotion) return;

    elapsed.value = withDelay(
      delay,
      withTiming(totalMs, { duration: totalMs, easing: Easing.linear }),
    );
    return () => cancelAnimation(elapsed);
  }, [active, delay, elapsed, reducedMotion, text, totalMs]);

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
              startMs={index++ * step}
              elapsed={elapsed}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function TypedChar({
  char,
  startMs,
  elapsed,
}: {
  char: string;
  startMs: number;
  elapsed: SharedValue<number>;
}) {
  const animated = useAnimatedStyle(() => ({
    opacity: easing.enter(
      Math.max(0, Math.min(1, (elapsed.value - startMs) / duration.type)),
    ),
  }));

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
  reward = false,
}: {
  label: string;
  onPress: () => void;
  reward?: boolean;
}) {
  return (
    <ChunkyButton
      label={label}
      shape="card"
      tone={reward ? undefined : {
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
    triggerCelebrationHaptic();
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
    backgroundColor: CELEBRATION_HUE.base,
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
    // The headline is centred and larger than anything around it, so it can run
    // wider than the screen margin without ever touching an edge.
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
    // A step down from `display1`: these headlines are sentences, not a single
    // number, and at 48 a long one took three lines and pushed the flame off
    // the top of an SE.
    ...typography.display.display2,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.title.title3,
    color: colors.onBlock.textMuted,
    textAlign: 'center',
  },
  subtitleDetail: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.onBlock.textFaint,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  progressBlock: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  rewardTitle: {
    ...typography.display.display2,
    color: decorationRewardPalette.ink,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  rewardBadge: {
    backgroundColor: decorationRewardPalette.track,
  },
  completedProgressBlock: {
    alignSelf: 'center',
    width: '78%',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  completedProgressLabel: {
    textAlign: 'center',
    color: decorationRewardPalette.ink,
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
