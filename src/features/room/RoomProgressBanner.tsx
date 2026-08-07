import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { HexRoom } from './RoomScene';
import { getRoomDay } from './roomDays';
import { toFrameHue, toPicks } from './roomPicks';
import { useRoomClaim } from './useRoomClaim';
import { useStartDaily, type DailyId } from '../../hooks/useStartDaily';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { RootStackNavigationProp } from '../../app/navigation';

const THUMB_WIDTH = 40;
const CHECK_SIZE = 14;
const DOT_SIZE = 22;

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
 * for — so this sits below the share CTA with no modal, no interstitial and
 * nothing blocking the exit. The Home badge carries the real cue, which is what
 * lets this stay quiet.
 *
 * It renders on *every* session, not just the third. Most sessions are someone's
 * first or second of the day, and "one more to go" is the whole pull.
 */
export default function RoomProgressBanner({
  sourceScreen,
  style,
}: RoomProgressBannerProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress, dailies, isLoading } = useRoomClaim(userId);
  const { start } = useStartDaily(sourceScreen);

  // Nothing to say once today is spent or the room is full — the next move is
  // on Home, and a banner repeating it here would only nag.
  if (isLoading || progress.claimedToday || progress.isComplete) {
    return null;
  }

  const day = progress.nextSlot == null ? null : getRoomDay(progress.nextSlot);
  const remaining: { id: DailyId; label: string; done: boolean }[] = [
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
  const left = remaining.filter((daily) => !daily.done).length;

  const thumbnail = (
    <HexRoom
      width={THUMB_WIDTH}
      picks={toPicks(room?.decorations ?? [])}
      frameHue={toFrameHue(room?.frameHue)}
    />
  );

  if (progress.canClaim) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="A new piece is ready for your room"
        accessibilityHint="Opens your room to choose it"
        style={({ pressed }) => [
          styles.banner,
          styles.row,
          pressed && styles.pressed,
          style,
        ]}
        onPress={() => {
          triggerTapHaptic();
          navigation.navigate('RoomDecorate');
        }}
      >
        {thumbnail}
        <View style={styles.copy}>
          <Text style={styles.title}>A new piece is ready</Text>
          <Text style={styles.subtitle}>
            {day == null ? 'Choose what goes in your room' : `Choose your ${day.note}`}
          </Text>
        </View>
        <Icon name="chevron-right" size={22} color={colors.text.tertiary} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.banner, style]}>
      <View style={styles.row}>
        {thumbnail}
        <View style={styles.copy}>
          <Text style={styles.title}>
            {left === 1 ? '1 more to earn your piece' : `${left} more to earn your piece`}
          </Text>
          {day != null ? (
            <Text style={styles.subtitle}>Next: {day.note}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.list}>
        {remaining.map((daily) => (
          <Pressable
            key={daily.id}
            accessibilityRole={daily.done ? 'text' : 'button'}
            accessibilityLabel={
              daily.done ? `${daily.label}, done` : `Start ${daily.label}`
            }
            disabled={daily.done}
            style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
            onPress={() => {
              triggerTapHaptic();
              start(daily.id);
            }}
          >
            <View style={[styles.dot, daily.done && styles.dotDone]}>
              {daily.done ? (
                <Icon
                  name="check"
                  size={CHECK_SIZE}
                  color={colors.text.inverse}
                />
              ) : null}
            </View>
            <Text
              style={[styles.listLabel, daily.done && styles.listLabelDone]}
            >
              {daily.label}
            </Text>
            {daily.done ? null : (
              <Icon
                name="chevron-right"
                size={20}
                color={colors.text.tertiary}
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...card.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  list: {
    gap: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.primary.blue200,
  },
  dotDone: {
    backgroundColor: colors.primary.blue700,
    borderColor: colors.primary.blue700,
  },
  listLabel: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.primary,
  },
  listLabelDone: {
    color: colors.text.tertiary,
  },
});
