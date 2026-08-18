import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import { DAILIES_PER_DAY } from '../../lib/dailies';
import {
  ROOM_SLOT_COUNT,
  type RoomProgress,
} from '../../lib/room/roomProgress';
import NextDayCountdown from './NextDayCountdown';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';
import type { DailiesCompletion } from '../../hooks/useDailiesCompletion';

const BAR_HEIGHT = 12;
/** Shorter than a screen's primary — this one sits inside a card. */
const CTA_MIN_HEIGHT = 48;

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
  dailies: Pick<
    DailiesCompletion,
    'guidedCompleted' | 'handPickedCompleted' | 'breathHoldCompleted'
  >;
  isLoading: boolean;
}

export default function RoomProgressCard({
  progress,
  dailies,
  isLoading,
}: RoomProgressCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  // Deliberately not gated on an existing room: the first `rooms` row is only
  // written when the first piece is placed, so requiring one hid this card from
  // exactly the users who have never been through the loop.
  if (isLoading) {
    return null;
  }

  const view = describeRoomCard({
    isComplete: progress.isComplete,
    canClaim: progress.canClaim,
    claimedToday: progress.claimedToday,
    dailiesDoneCount: [
      dailies.guidedCompleted,
      dailies.handPickedCompleted,
      dailies.breathHoldCompleted,
    ].filter(Boolean).length,
    placedCount: progress.placedCount,
  });

  return (
    <RoomProgressCardView
      view={view}
      onAction={(route) => navigation.navigate(route)}
    />
  );
}

/**
 * The card with its state handed to it, so the dev lab can show every state at
 * once without arranging a week of real progress.
 */
export function RoomProgressCardView({
  view,
  onAction,
}: {
  view: RoomCardView;
  onAction: (route: RoomCardRoute) => void;
}) {
  const action = view.action;

  return (
    <View style={styles.card}>
      <View style={styles.headline}>
        <Icon name="room-hex" size={26} color={colors.primary.blue600} />
        <Text style={styles.title}>{view.title}</Text>
        <Text style={styles.count}>
          {view.done} / {view.total}
        </Text>
      </View>

      {view.countdown === true ? <NextDayCountdown style={styles.note} /> : null}

      <View style={styles.barRow}>
        <ProgressBar
          progress={view.done / view.total}
          height={BAR_HEIGHT}
          trackColor={
            view.complete === true ? colors.success[100] : colors.primary.blue100
          }
          fillColor={
            view.complete === true ? colors.success[500] : colors.primary.blue600
          }
          style={styles.bar}
        />
        <Icon
          name={
            view.complete === true ? 'check' : view.earned ? 'unlock' : 'lock'
          }
          size={22}
          color={
            view.complete === true
              ? colors.success[500]
              : view.earned
                ? colors.primary.blue600
                : colors.text.tertiary
          }
        />
      </View>

      {action == null ? null : (
        <ChunkyButton
          label={action.label}
          shape="card"
          minHeight={CTA_MIN_HEIGHT}
          trailingIcon={
            <Icon name="chevron-right" size={16} color={colors.text.inverse} />
          }
          onPress={() => onAction(action.route)}
        />
      )}
    </View>
  );
}

export type RoomCardRoute = 'RoomDecorate' | 'NextRoom';

export interface RoomCardView {
  title: string;
  /** the wait until the next piece, for a day with nothing left to do */
  countdown?: boolean;
  /** drives the lock at the end of the bar */
  earned: boolean;
  /** the day is finished — the bar goes green and the lock becomes a tick */
  complete?: boolean;
  /** the bar counts whatever the title is about, never something else */
  done: number;
  total: number;
  action: { label: string; route: RoomCardRoute } | null;
}

/**
 * The card speaks in terms of today's dailies, because that is the thing the
 * user controls — the floor number is bookkeeping. A button appears only when
 * there is something waiting that they cannot otherwise reach.
 */
export function describeRoomCard({
  isComplete,
  canClaim,
  claimedToday,
  dailiesDoneCount,
  placedCount,
}: {
  isComplete: boolean;
  canClaim: boolean;
  claimedToday: boolean;
  dailiesDoneCount: number;
  placedCount: number;
}): RoomCardView {
  const room = { done: placedCount, total: ROOM_SLOT_COUNT };
  // A full room earns nothing until the next floor is opened, and opening it is
  // otherwise only offered once, right after the seventh piece lands. Anyone who
  // missed that screen would be stuck here forever.
  if (isComplete) {
    return {
      title: 'This floor is finished',
      earned: true,
      ...room,
      action: { label: 'Choose your next room', route: 'NextRoom' },
    };
  }

  if (canClaim) {
    return {
      title: 'Your piece is ready',
      earned: true,
      ...room,
      action: { label: 'Place it in your room', route: 'RoomDecorate' },
    };
  }

  if (claimedToday) {
    // Today is what this state is about, so the bar stays on today rather than
    // dropping back to a room count that reads as progress lost.
    // Nothing here is actionable today, so the card's job is the next day:
    // point at when it opens rather than closing the loop with a tick.
    return {
      title: 'All set for today!',
      countdown: true,
      earned: true,
      complete: true,
      done: DAILIES_PER_DAY,
      total: DAILIES_PER_DAY,
      action: null,
    };
  }

  // Still working through today. The bar counts the three dailies, because that
  // is what the title asks for — showing room pieces here read as "finish
  // today's dailies — 1 / 7", which asks for four days that do not exist.
  //
  // Finishing them can only land in `canClaim` above, never here: that flag is
  // built from the same `allCompleted` this branch would test.
  return {
    title: "Finish today's dailies",
    earned: false,
    done: dailiesDoneCount,
    total: DAILIES_PER_DAY,
    action: null,
  };
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.md,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title3,
    fontSize: 19,
    lineHeight: 26,
    flex: 1,
    color: colors.text.primary,
  },
  // Beside the bar rather than inside it: the fill runs the whole track, so
  // there is no colour a centred count stays legible against end to end.
  note: {
    marginTop: -spacing.xs,
  },
  count: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bar: {
    flex: 1,
  },
});
