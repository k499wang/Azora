import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ChunkyButton from '../../components/common/ChunkyButton';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { DailyId } from '../../hooks/useStartDaily';
import type { RoomSlot } from '../../lib/room/roomProgress';

const CHECK_SIZE = 18;
const CHECK_DOT_SIZE = 26;

/** everything under the room on the decorate screen, as one closed set */
export type DecorateState =
  | { kind: 'complete' }
  | { kind: 'claimed' }
  | {
      kind: 'locked';
      guidedDone: boolean;
      handPickedDone: boolean;
      breathHoldDone: boolean;
    }
  | { kind: 'choose'; slot: RoomSlot };

interface DecoratePanelProps {
  state: DecorateState;
  onSeeRoom: () => void;
  onStartDaily: (daily: DailyId) => void;
}

/**
 * What the screen's title says in each state.
 *
 * Lives here because it is the same closed set the panel switches on, and the
 * two must not drift. The screen renders it, so every room screen's title is in
 * the one place `RoomScreenTitle` puts it.
 */
export function decorateTitle(state: DecorateState): string {
  switch (state.kind) {
    case 'complete':
      return 'This room is finished';
    case 'claimed':
      return "Today's piece is placed";
    case 'locked':
      return "Finish today's dailies";
    case 'choose':
      return 'Pick your decoration';
  }
}

/**
 * The line under the title, where there is one.
 *
 * Only the choosing state has something more to say, and what it says is where
 * to tap — the picker lives on the room now, not under it.
 */
export function decorateNote(state: DecorateState): string | undefined {
  return state.kind === 'choose'
    ? "Tap the + to place today's piece"
    : undefined;
}

/**
 * The three things the decorate screen can say under the room, split out from
 * the screen so all of them can be rendered without arranging the room state
 * that produces them. The screen owns the data; this owns the pixels.
 *
 * The title is the screen's, not the panel's — see `decorateTitle`.
 */
export default function DecoratePanel({
  state,
  onSeeRoom,
  onStartDaily,
}: DecoratePanelProps) {
  if (state.kind === 'complete') {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelBody}>
          Every piece is placed. Open your next room to keep going.
        </Text>
        <ChunkyButton
          label="See your room"
          shape="card"
          style={styles.primaryButton}
          onPress={onSeeRoom}
        />
      </View>
    );
  }

  if (state.kind === 'claimed') {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelBody}>Come back tomorrow for the next one.</Text>
      </View>
    );
  }

  if (state.kind === 'locked') {
    const dailies: { id: DailyId; label: string; done: boolean }[] = [
      { id: 'guided', label: 'Guided breathing', done: state.guidedDone },
      {
        id: 'handPicked',
        label: 'Hand-picked exercise',
        done: state.handPickedDone,
      },
      {
        id: 'breathHold',
        label: 'Daily breath hold',
        done: state.breathHoldDone,
      },
    ];

    return (
      <View style={styles.panel}>
        <Text style={styles.panelBody}>
          All three earn you a piece for this room.
        </Text>
        <View style={styles.checklist}>
          {dailies.map((daily) => (
            <Pressable
              key={daily.id}
              accessibilityRole={daily.done ? 'text' : 'button'}
              accessibilityLabel={
                daily.done ? `${daily.label}, done` : `Start ${daily.label}`
              }
              disabled={daily.done}
              style={styles.checklistRow}
              onPress={() => onStartDaily(daily.id)}
            >
              <View style={[styles.checkDot, daily.done && styles.checkDotDone]}>
                {daily.done ? (
                  <Icon
                    name="check"
                    size={CHECK_SIZE}
                    color={colors.text.inverse}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.checklistLabel,
                  daily.done && styles.checklistLabelDone,
                ]}
              >
                {daily.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // Choosing happens on the room itself — the "+" standing in the empty slot
  // opens `PickDecorationSheet`. Nothing belongs under the room while it does.
  return null;
}

const styles = StyleSheet.create({
  panel: {
    ...card.base,
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  panelBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  checklist: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkDot: {
    width: CHECK_DOT_SIZE,
    height: CHECK_DOT_SIZE,
    borderRadius: CHECK_DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.primary.blue200,
  },
  checkDotDone: {
    backgroundColor: colors.primary.blue700,
    borderColor: colors.primary.blue700,
  },
  checklistLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  checklistLabelDone: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
});
