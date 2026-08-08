import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import { getRoomDay } from './roomDays';
import { useRoomClaim } from './useRoomClaim';
import { useStartDaily, type DailyId } from '../../hooks/useStartDaily';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackNavigationProp } from '../../app/navigation';

const BADGE_SIZE = 34;
const BAR_HEIGHT = 12;

// A soft tap as the fill leaves, a firmer one as it lands, and the success
// pattern reserved for the step that actually unlocks the piece.
function fillStartHaptic() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function fillEndHaptic(unlocked: boolean) {
  if (!isHapticsEnabled()) return;

  if (unlocked) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

interface RoomProgressBannerProps {
  sourceScreen: string;
  style?: ViewStyle;
}

/**
 * How close today is to earning a piece, shown after a session.
 *
 * Deliberately quiet, and this is where the design departs from Duolingo and
 * Finch: they celebrate hard at the completion screen because their post-task
 * state is achievement. A breathing app's is calm — the thing the session was
 * for — so this stays a card with no modal, no interstitial and nothing
 * blocking the exit. The Home badge carries the real cue, which is what lets
 * this stay quiet.
 *
 * It renders on *every* session, not just the third. Most sessions are someone's
 * first or second of the day, and watching the bar move is the whole pull.
 */
export default function RoomProgressBanner({
  sourceScreen,
  style,
}: RoomProgressBannerProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { progress, dailies, isLoading } = useRoomClaim(userId);
  const { start } = useStartDaily(sourceScreen);

  // Nothing to say once today is spent or the room is full — the next move is
  // on Home, and a banner repeating it here would only nag.
  if (isLoading || progress.claimedToday || progress.isComplete) {
    return null;
  }

  const day = progress.nextSlot == null ? null : getRoomDay(progress.nextSlot);
  const dailyList: { id: DailyId; label: string; done: boolean }[] = [
    { id: 'guided', label: 'Guided breathing', done: dailies.guidedCompleted },
    {
      id: 'handPicked',
      label: 'Hand-picked exercise',
      done: dailies.handPickedCompleted,
    },
    {
      id: 'breathHold',
      label: 'Daily breath hold',
      done: dailies.breathHoldCompleted,
    },
  ];
  const total = dailyList.length;
  const done = dailyList.filter((daily) => daily.done).length;
  const next = dailyList.find((daily) => !daily.done) ?? null;

  // The session that just ended is one of these three, so the bar starts a step
  // behind and fills to where they actually are. That step is the reward.
  const bar = (
    <ProgressBar
      progress={done / total}
      from={Math.max(0, done - 1) / total}
      height={BAR_HEIGHT}
      onFillStart={fillStartHaptic}
      onFillEnd={() => fillEndHaptic(progress.canClaim)}
      style={styles.bar}
    />
  );

  if (progress.canClaim) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="A new piece is ready for your room"
        accessibilityHint="Opens your room to choose it"
        style={({ pressed }) => [styles.banner, pressed && styles.pressed, style]}
        onPress={() => {
          triggerTapHaptic();
          navigation.navigate('RoomDecorate');
        }}
      >
        <Text style={styles.title}>Today's piece</Text>
        <View style={styles.barRow}>
          {bar}
          <View style={[styles.badge, styles.badgeUnlocked]}>
            <Icon
              name="chevron-right"
              size={20}
              color={colors.text.inverse}
            />
          </View>
        </View>
        <Text style={styles.caption}>
          {day == null
            ? 'Tap to choose what goes in your room'
            : `Tap to choose your ${day.note}`}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.banner, style]}>
      <Text style={styles.title}>Today's piece</Text>
      <View style={styles.barRow}>
        {bar}
        <View style={styles.badge}>
          <Icon name="lock" size={18} color={colors.text.tertiary} />
        </View>
      </View>
      <Text style={styles.caption}>
        {done} of {total} done — finish all three to unlock
      </Text>

      {next == null ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start ${next.label}`}
          style={({ pressed }) => [styles.nextRow, pressed && styles.pressed]}
          onPress={() => {
            triggerTapHaptic();
            start(next.id);
          }}
        >
          <Text style={styles.nextLabel}>Next: {next.label}</Text>
          <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...card.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
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
    backgroundColor: colors.primary.blue100,
  },
  badgeUnlocked: {
    backgroundColor: colors.primary.blue600,
  },
  caption: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  nextLabel: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.primary,
  },
});
