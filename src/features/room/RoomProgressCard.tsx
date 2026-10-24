import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import ProgressBar from '../../components/common/ProgressBar';
import Skeleton from '../../components/common/Skeleton';
import ChunkyButton, {
  CHUNKY_TONE,
  CHUNKY_TONE_AMBER,
} from '../../components/common/ChunkyButton';
import type { RoomProgress } from '../../lib/room/roomProgress';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';
import type { DayCompletion } from './useDayCompletion';

/** Shared with the loading placeholder. */
const BAR_HEIGHT = 8;
/** A short pill under the day label, not a full-width rule. */
const BAR_WIDTH = 100;
const CTA_MIN_HEIGHT = 28;

export type RoomCardTone = 'waiting' | 'ready' | 'done';

/**
 * Amber marks the ready state: it is the room action waiting for the user.
 * The finished-room action stays on the standard primary CTA.
 */
const TONE_STYLE: Record<
  RoomCardTone,
  {
    accent: string;
    track: string;
    countInk: string;
    cta: typeof CHUNKY_TONE;
  }
> = {
  waiting: {
    accent: colors.playful.sky.mid,
    track: colors.playful.sky.soft,
    countInk: colors.playful.sky.ink,
    cta: CHUNKY_TONE,
  },
  ready: {
    accent: colors.playful.amber.base,
    track: colors.playful.amber.soft,
    countInk: colors.playful.amber.ink,
    cta: CHUNKY_TONE_AMBER,
  },
  done: {
    accent: colors.success[500],
    track: colors.success[100],
    countInk: colors.success[700],
    cta: CHUNKY_TONE,
  },
};

/**
 * Where the room loop is, and the way back into it.
 *
 * Every other route into decorating is a one-shot: the post-session sheet, and
 * the screen that opens the next floor after the seventh piece lands. Closing
 * either one — or the app — used to leave a claimable piece, or a finished room
 * waiting to roll over, with nothing anywhere that led back to it. This is the
 * standing entry point, so no state of the loop is ever unreachable.
 */
interface RoomProgressCardProps {
  progress: Pick<
    RoomProgress,
    'isComplete' | 'canClaim' | 'claimedToday' | 'placedCount'
  >;
  day: Pick<DayCompletion, 'done' | 'total'>;
  isLoading: boolean;
  /**
   * Opens the day's piece. Not a route: the reward stage is drawn over whatever
   * screen the user finished the day on, and this card's job is to make it
   * reachable again later — from the same Home whose room the stage grows out
   * of and returns to.
   */
  onClaim: () => void;
  /** The app tour's progress stop. */
  target?: CardTarget;
}

type CardTarget = { ref: Ref<View>; collapsable: false };

export default function RoomProgressCard({
  progress,
  day,
  isLoading,
  onClaim,
  target,
}: RoomProgressCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  // Deliberately not gated on an existing room: the first `rooms` row is only
  // written when the first piece is placed, so requiring one hid this card from
  // exactly the users who have never been through the loop.
  if (isLoading) {
    return <RoomProgressCardPlaceholder target={target} />;
  }

  return (
    <RoomProgressCardView
      view={describeRoomProgress(progress, day)}
      onAction={(action) =>
        action.kind === 'claim' ? onClaim() : navigation.navigate(action.route)
      }
      target={target}
    />
  );
}

/**
 * The card's own shape while its room data loads.
 *
 * Returning null here left a card-sized hole that filled in whenever the query
 * landed, shoving today's list down the page — under the tour's cutout, and
 * under the user's thumb on the way to a daily. Built from the same pieces at
 * the same sizes as the waiting state, so nothing moves when the real one
 * replaces it.
 */
function RoomProgressCardPlaceholder({ target }: { target?: CardTarget }) {
  return (
    <View
      {...target}
      accessibilityLabel="Loading room progress"
      style={styles.strip}
    >
      <View style={styles.barSlot}>
        <Skeleton height={BAR_HEIGHT} radius={radius.full} />
      </View>
    </View>
  );
}

/**
 * The card with its state handed to it, so the dev lab can show every state at
 * once without arranging a week of real progress.
 */
export function RoomProgressCardView({
  view,
  onAction,
  target,
}: {
  view: RoomCardView;
  onAction: (action: RoomCardAction) => void;
  target?: CardTarget;
}) {
  const action = view.action;
  const tone = TONE_STYLE[view.tone];

  return (
    <View {...target} accessibilityLabel={view.title} style={styles.strip}>
      <View style={styles.barSlot}>
        <ProgressBar
          progress={view.total === 0 ? 0 : view.done / view.total}
          height={BAR_HEIGHT}
          trackColor={tone.track}
          fillColor={tone.accent}
        />
      </View>
      <Text style={[styles.count, { color: tone.countInk }]}>
        {view.done}/{view.total}
      </Text>

      {action == null ? null : (
        <ChunkyButton
          label={action.label}
          shape="card"
          tone={tone.cta}
          minHeight={CTA_MIN_HEIGHT}
          onPress={() => onAction(action)}
        />
      )}
    </View>
  );
}

/** The card's state for Home's room and day, for anything that mirrors it. */
export function describeRoomProgress(
  progress: RoomProgressCardProps['progress'],
  day: RoomProgressCardProps['day'],
): RoomCardView {
  return describeRoomCard({
    isComplete: progress.isComplete,
    canClaim: progress.canClaim,
    claimedToday: progress.claimedToday,
    doneCount: day.done,
    totalCount: day.total,
    placedCount: progress.placedCount,
  });
}

export type RoomCardRoute = 'NextRoom';

/**
 * What the card's button does. Claiming is not a route any more — the reward
 * opens in place, wherever the user is — so the two cases cannot both be
 * expressed as a screen name.
 */
export type RoomCardAction =
  | { label: string; kind: 'route'; route: RoomCardRoute }
  | { label: string; kind: 'claim' };

export interface RoomCardView {
  title: string;
  /** drives the icon, the bar and the button */
  tone: RoomCardTone;
  /** the bar counts whatever the title is about, never something else */
  done: number;
  total: number;
  action: RoomCardAction | null;
}

/**
 * The card speaks in terms of today's plan activities because that is what
 * earns a decoration; the floor number is bookkeeping. An actionable end
 * state is represented by one direct button.
 */
export function describeRoomCard({
  isComplete,
  canClaim,
  claimedToday,
  doneCount,
  totalCount,
}: {
  isComplete: boolean;
  canClaim: boolean;
  claimedToday: boolean;
  /** everything today asks for, done and in total */
  doneCount: number;
  totalCount: number;
  placedCount: number;
}): RoomCardView {
  const today = {
    title: totalCount > 0 && doneCount >= totalCount
      ? 'Decoration unlocked!'
      : 'Unlock your next decoration',
    done: doneCount,
    total: totalCount,
  };
  // A full room earns nothing until the next floor is opened, and opening it is
  // otherwise only offered once, right after the seventh piece lands. Anyone who
  // missed that screen would be stuck here forever.
  if (isComplete) {
    return {
      ...today,
      tone: 'ready',
      action: { label: 'New room', kind: 'route', route: 'NextRoom' },
    };
  }

  // The bar stays on today and stays full: the day is what earned this, and
  // dropping to a room count here read as "0 / 7" beside a title saying the
  // thing was ready.
  if (canClaim) {
    return {
      ...today,
      tone: 'ready',
      action: { label: 'Claim', kind: 'claim' },
    };
  }

  if (claimedToday) {
    // Today is what this state is about, so the bar stays on today's completed
    // plan activities rather than dropping back to a room count that reads as
    // progress lost.
    return {
      ...today,
      tone: 'done',
      action: null,
    };
  }

  // Room pieces never change the count of today's completed steps.
  return {
    ...today,
    tone: 'waiting',
    action: null,
  };
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  barSlot: {
    width: BAR_WIDTH,
  },
  count: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
});
