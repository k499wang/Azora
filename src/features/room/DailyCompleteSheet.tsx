import { memo, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
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
import { Pop, Rise } from '../../components/common/Reveal';
import BlobCharacter, {
  type CharacterId,
} from '../../components/home/BlobCharacter';
import { useRoomClaim } from './useRoomClaim';
import { getRoomDay, getRoomDayLabel } from './roomDays';
import { markSeenDailies, readSeenDailies } from './dailyProgressSeen';
import { useAuthStore } from '../../stores/authStore';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { radius } from '../../theme/card';
import { duration, easing, spring } from '../../theme/motion';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { RoomSlot } from '../../lib/room/roomProgress';
import type { PlayfulHue } from '../exercise/guidedBreathing/categoryPalette';
import type { RootStackNavigationProp } from '../../app/navigation';

const BLOB_SIZE = 190;
const BADGE_SIZE = 38;
const BAR_HEIGHT = 12;
const FALL_MS = duration.base;
const TOTAL_DAILIES = 3;

// Every element lands on its own beat, top to bottom, from the moment the
// screen appears. These used to be offset by a slide-up that no longer happens,
// which left the whole sheet sitting empty for the first half second.
const BEAT = {
  blob: 60,
  title: 200,
  subtitle: 290,
  stats: 400,
  progress: 560,
  cta: 700,
} as const;

const CONFETTI_MS = 140;
// After the last element has finished arriving, not during it — this is when
// callers mount their charts and cards.
const SETTLED_MS = 1300;

/** everything the sheet needs to know about the room, so it can be faked */
export interface DailyCompleteState {
  /** how many of the three dailies are done, 0..3 */
  done: number;
  /** all three done and the piece not yet placed */
  unlocked: boolean;
  /** false once today's piece is placed, or the room is full */
  showBar: boolean;
  nextSlot: RoomSlot | null;
}

interface DailyCompleteSheetProps {
  visible: boolean;
  /** the colour the whole screen is painted in — the exercise's category hue */
  hue: PlayfulHue;
  character: CharacterId;
  title: string;
  subtitle: string;
  /** the two or three headline numbers, shown as tiles */
  stats?: { label: string; value: string }[];
  /**
   * Overrides the live room state. Only the dev lab passes this — it is what
   * lets every case be seen without spending three real exercises on each.
   */
  state?: DailyCompleteState;
  /**
   * Fires once the entrance has finished, or as soon as the sheet starts
   * leaving. Callers mount their expensive content on this rather than up
   * front — a chart building its path on the JS thread mid-animation is what
   * makes the entrance stutter.
   */
  onSettled?: () => void;
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
export default function DailyCompleteSheet({
  visible,
  hue,
  character,
  title,
  subtitle,
  stats = [],
  state,
  onSettled,
  onDismiss,
}: DailyCompleteSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const navigation = useNavigation<RootStackNavigationProp>();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { progress, dailies } = useRoomClaim(userId);

  // Starts covering, rather than sliding up into place. Rising from off-screen
  // means the results screen is visible behind it for the length of the
  // animation, which reads as the wrong screen flashing before the right one.
  // The contents animate in instead; only leaving is a slide.
  const offset = useSharedValue(0);
  const badge = useSharedValue(0);

  const live: DailyCompleteState = {
    done: [
      dailies.guidedCompleted,
      dailies.handPickedCompleted,
      dailies.breathHoldCompleted,
    ].filter(Boolean).length,
    unlocked: progress.canClaim,
    showBar: !progress.isComplete && !progress.claimedToday,
    nextSlot: progress.nextSlot,
  };
  // Frozen on open. A background refetch landing mid-entrance would otherwise
  // re-render the whole sheet and could retarget the bar while it is filling.
  const [frozen, setFrozen] = useState<DailyCompleteState | null>(null);
  const view = frozen ?? state ?? live;
  const { done, unlocked, showBar } = view;

  // Start the fill wherever they last saw it. When this session did not move
  // the count — a daily re-run, say — the two ends match and `ProgressBar`
  // leaves it alone rather than replaying a step that never happened. A faked
  // state always animates, since the point there is to watch it move.
  const barFrom =
    (state != null
      ? Math.max(0, done - 1)
      : (readSeenDailies(dailies.todayLocalDate) ?? Math.max(0, done - 1))) /
    TOTAL_DAILIES;

  const day = view.nextSlot == null ? null : getRoomDay(view.nextSlot);
  const pieceLabel =
    view.nextSlot == null ? null : getRoomDayLabel(view.nextSlot);
  const remaining = Math.max(0, TOTAL_DAILIES - done);

  // On the third daily the screen stops being about the session and starts
  // being about the thing they just earned, so the copy changes with it.
  const headline = unlocked ? 'All three done' : title;
  const supporting = unlocked
    ? pieceLabel == null
      ? 'You unlocked a new piece for your room'
      : `You unlocked a new ${pieceLabel}`
    : subtitle;

  useEffect(() => {
    if (!visible) {
      offset.value = 0;
      badge.value = 0;
      setFrozen(null);
      return;
    }

    setFrozen(state ?? live);

    // Never let a faked state write over what the user has really seen.
    if (state == null) {
      markSeenDailies(dailies.todayLocalDate, done);
    }

    const settle =
      onSettled == null ? null : setTimeout(onSettled, SETTLED_MS);

    if (unlocked) {
      badge.value = withDelay(
        900,
        withSequence(
          withTiming(1, { duration: 160 }),
          withSpring(0.6, spring.bounce),
        ),
      );
    }
    return () => {
      if (settle != null) clearTimeout(settle);
    };
    // `onSettled` is deliberately excluded: callers pass inline closures, and
    // re-running this would restart the entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    badge,
    dailies.todayLocalDate,
    done,
    height,
    offset,
    state,
    unlocked,
    visible,
  ]);

  const close = () => {
    triggerTapHaptic();
    // If they leave before the entrance settles, the content behind still has
    // to exist before the sheet uncovers it.
    onSettled?.();
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
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onDismiss();
    navigation.navigate('RoomDecorate');
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
          <View style={styles.center}>
            <Confetti hue={hue} />
            <Pop delay={BEAT.blob}>
              <BlobCharacter
                character={character}
                faceExpression="energy"
                size={BLOB_SIZE}
                bodyColor={hue.soft}
                faceColor={hue.ink}
              />
            </Pop>
            <Rise delay={BEAT.title}>
              <Text style={styles.title}>{headline}</Text>
            </Rise>
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
                  progress={done / TOTAL_DAILIES}
                  from={barFrom}
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
                  : `${remaining} more to unlock your piece`}
              </Text>
            </Rise>
          ) : null}

          <Rise delay={BEAT.cta} style={styles.ctaBlock}>
            {unlocked ? (
              <>
                <ChunkyButton
                  label="Choose your piece"
                  hue={hue}
                  onPress={choosePiece}
                />
                <Pressable style={styles.secondary} onPress={close}>
                  <Text style={styles.secondaryLabel}>Later</Text>
                </Pressable>
              </>
            ) : (
              <ChunkyButton label="Continue" hue={hue} onPress={close} />
            )}
          </Rise>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Duolingo's button, borrowed wholesale: a solid face sitting 4pt above a
 * darker lip, so pressing it physically drops onto the lip instead of just
 * dimming. It is the single most recognisable thing on their screen.
 */
function ChunkyButton({
  label,
  hue,
  onPress,
}: {
  label: string;
  hue: PlayfulHue;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.ctaLip, { backgroundColor: hue.ink }]}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.ctaFace, pressed && styles.ctaFacePressed]}>
          <Text style={[styles.ctaLabel, { color: hue.ink }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// Fixed rather than random: the same burst every time reads as choreography,
// and a re-render mid-flight would otherwise reshuffle it.
const CONFETTI = [
  { angle: -80, distance: 150, size: 10, delay: 0, spin: 220 },
  { angle: -50, distance: 190, size: 7, delay: 40, spin: -180 },
  { angle: -20, distance: 165, size: 12, delay: 90, spin: 300 },
  { angle: 10, distance: 200, size: 8, delay: 20, spin: -260 },
  { angle: 40, distance: 175, size: 11, delay: 70, spin: 190 },
  { angle: 70, distance: 145, size: 7, delay: 110, spin: -320 },
  { angle: 120, distance: 160, size: 9, delay: 50, spin: 240 },
  { angle: 150, distance: 185, size: 12, delay: 0, spin: -200 },
  { angle: 180, distance: 155, size: 8, delay: 95, spin: 280 },
  { angle: 210, distance: 195, size: 10, delay: 30, spin: -230 },
  { angle: 240, distance: 170, size: 7, delay: 80, spin: 210 },
  { angle: 265, distance: 140, size: 11, delay: 60, spin: -290 },
];

const Confetti = memo(function Confetti({ hue }: { hue: PlayfulHue }) {
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {CONFETTI.map((piece, index) => (
        <ConfettiPiece key={index} piece={piece} hue={hue} />
      ))}
    </View>
  );
});

function ConfettiPiece({
  piece,
  hue,
}: {
  piece: (typeof CONFETTI)[number];
  hue: PlayfulHue;
}) {
  const fly = useSharedValue(0);
  const radians = (piece.angle * Math.PI) / 180;

  useEffect(() => {
    fly.value = withDelay(
      CONFETTI_MS + piece.delay,
      withTiming(1, { duration: 1100, easing: easing.burst }),
    );
  }, [fly, piece.delay]);

  const style = useAnimatedStyle(() => {
    const travel = interpolate(fly.value, [0, 1], [0, piece.distance]);
    // Gravity on the way out — pieces arc rather than shooting in straight lines.
    const drop = interpolate(fly.value, [0, 1], [0, 90]);

    return {
      opacity: interpolate(fly.value, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: Math.cos(radians) * travel },
        { translateY: Math.sin(radians) * travel + drop },
        { rotate: `${interpolate(fly.value, [0, 1], [0, piece.spin])}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: piece.size,
          height: piece.size * 0.6,
          backgroundColor: piece.size % 2 === 0 ? colors.text.inverse : hue.soft,
        },
        style,
      ]}
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
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
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
  ctaLip: {
    alignSelf: 'stretch',
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  ctaFace: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.text.inverse,
    transform: [{ translateY: -4 }],
  },
  ctaFacePressed: {
    transform: [{ translateY: 0 }],
  },
  ctaLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  title: {
    ...typography.display.display2,
    color: colors.text.inverse,
    textAlign: 'center',
    marginTop: spacing.lg,
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
  secondary: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  secondaryLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.onBlock.textMuted,
  },
});
