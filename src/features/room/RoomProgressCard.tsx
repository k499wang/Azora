import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import { useRoomClaim } from './useRoomClaim';
import { DAILIES_PER_DAY } from '../../hooks/useDailiesCompletion';
import { ROOM_SLOT_COUNT } from '../../lib/room/roomProgress';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';

const BAR_HEIGHT = 12;

/**
 * Where the room loop is, and the way back into it.
 *
 * Every other route into decorating is a one-shot: the post-session sheet, and
 * the screen that opens the next floor after the seventh piece lands. Closing
 * either one — or the app — used to leave a claimable piece, or a finished room
 * waiting to roll over, with nothing anywhere that led back to it. This is the
 * standing entry point, so no state of the loop is ever unreachable.
 */
export default function RoomProgressCard() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress, dailies, isLoading } = useRoomClaim(userId);
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  if (isLoading || room == null) {
    return null;
  }

  const view = describe({
    isComplete: progress.isComplete,
    canClaim: progress.canClaim,
    claimedToday: progress.claimedToday,
    dailiesDone: dailies.allCompleted,
    dailiesDoneCount: [
      dailies.guidedCompleted,
      dailies.handPickedCompleted,
      dailies.breathHoldCompleted,
    ].filter(Boolean).length,
    placedCount: progress.placedCount,
  });

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
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => {
            triggerTapHaptic();
            navigation.navigate(action.route);
          }}
        >
          <Text style={styles.buttonLabel}>{action.label}</Text>
          <Icon name="chevron-right" size={16} color={colors.text.inverse} />
        </Pressable>
      )}
    </View>
  );
}

interface CardView {
  title: string;
  /** drives the lock at the end of the bar */
  earned: boolean;
  /** the day is finished — the bar goes green and the lock becomes a tick */
  complete?: boolean;
  /** the bar counts whatever the title is about, never something else */
  done: number;
  total: number;
  action: { label: string; route: 'RoomDecorate' | 'NextRoom' } | null;
}

/**
 * The card speaks in terms of today's dailies, because that is the thing the
 * user controls — the floor number is bookkeeping. A button appears only when
 * there is something waiting that they cannot otherwise reach.
 */
function describe({
  isComplete,
  canClaim,
  claimedToday,
  dailiesDone,
  dailiesDoneCount,
  placedCount,
}: {
  isComplete: boolean;
  canClaim: boolean;
  claimedToday: boolean;
  dailiesDone: boolean;
  dailiesDoneCount: number;
  placedCount: number;
}): CardView {
  const room = { done: placedCount, total: ROOM_SLOT_COUNT };
  const today = { done: dailiesDoneCount, total: DAILIES_PER_DAY };
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
    return {
      title: 'Placed for today',
      earned: true,
      complete: true,
      done: DAILIES_PER_DAY,
      total: DAILIES_PER_DAY,
      action: null,
    };
  }

  // Still working through today: the bar counts the three dailies, because
  // that is what the title asks for. Showing room pieces here read as
  // "finish today's dailies — 1 / 7", which asks for four days that do not exist.
  return dailiesDone
    ? {
        title: 'Your piece is ready',
        earned: true,
        ...room,
        action: null,
      }
    : {
        title: "Finish today's dailies",
        earned: false,
        ...today,
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
    flex: 1,
    color: colors.text.primary,
  },
  // Beside the bar rather than inside it: the fill runs the whole track, so
  // there is no colour a centred count stays legible against end to end.
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary.blue600,
  },
  buttonLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
