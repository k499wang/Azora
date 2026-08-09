import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import PagerDots from '../../components/common/PagerDots';
import { DecorationSolo } from './roomStage';
import { getRoomDay } from './roomDays';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
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
  busy?: boolean;
  /** which option is highlighted; the screen owns it so the room can preview it */
  selected?: string | null;
  onSelect?: (optionId: string | null) => void;
  onSeeRoom: () => void;
  onStartDaily: (daily: DailyId) => void;
  onPick: (optionId: string) => void;
}

/**
 * The four things the decorate screen can be saying, split out from the screen
 * so all of them can be rendered without arranging the room state that
 * produces them. The screen owns the data; this owns the pixels.
 */
export default function DecoratePanel({
  state,
  busy = false,
  selected = null,
  onSelect,
  onSeeRoom,
  onStartDaily,
  onPick,
}: DecoratePanelProps) {
  if (state.kind === 'complete') {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>This room is finished</Text>
        <Text style={styles.panelBody}>
          Every piece is placed. Open your next room to keep going.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onSeeRoom}>
          <Text style={styles.primaryButtonLabel}>See your room</Text>
        </Pressable>
      </View>
    );
  }

  if (state.kind === 'claimed') {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Today's piece is placed</Text>
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
        <Text style={styles.panelTitle}>Finish today's dailies</Text>
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

  return (
    <ChooseDecoration
      slot={state.slot}
      busy={busy}
      selected={selected}
      onSelect={onSelect}
      onPick={onPick}
    />
  );
}

const CARD_WIDTH = 190;
const CARD_HEIGHT = 170;
/** one card plus the gap after it — the snap step and the scroll-to offset */
const STRIDE = CARD_WIDTH + spacing.sm;

/**
 * Swipe through the options, then confirm.
 *
 * Tapping a card selects it rather than placing it — placing is irreversible
 * for the day, and a mis-tap that spends it is a bad trade for one saved press.
 * Each option is drawn on its own rather than sitting in the room: at thumbnail
 * size the room is what you see and the object is a speck.
 */
function ChooseDecoration({
  slot,
  busy,
  selected,
  onSelect,
  onPick,
}: {
  slot: RoomSlot;
  busy: boolean;
  selected: string | null;
  onSelect?: (optionId: string | null) => void;
  onPick: (optionId: string) => void;
}) {
  const scroller = useRef<ScrollView>(null);
  const day = getRoomDay(slot);

  if (day == null) {
    return null;
  }

  const index = day.options.findIndex((option) => option.id === selected);
  const chosen = index < 0 ? null : day.options[index];

  const select = (optionId: string, at: number, scroll: boolean) => {
    if (optionId === selected) return;

    triggerTapHaptic();
    onSelect?.(optionId);

    if (scroll) {
      scroller.current?.scrollTo({ x: at * STRIDE, animated: true });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pick your decoration</Text>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STRIDE}
        decelerationRate="fast"
        contentContainerStyle={styles.cardRow}
        onMomentumScrollEnd={(event) => {
          const at = Math.round(event.nativeEvent.contentOffset.x / STRIDE);
          const option = day.options[at];
          if (option != null) select(option.id, at, false);
        }}
      >
        {day.options.map((option, at) => {
          const active = option.id === selected;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.name}
              style={[styles.card, active && styles.cardSelected]}
              onPress={() => select(option.id, at, true)}
            >
              <DecorationSolo
                width={CARD_WIDTH - spacing.xl}
                height={CARD_HEIGHT - spacing.xl}
                day={slot}
                option={option.id}
              />
              <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                {option.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <PagerDots count={day.options.length} index={Math.max(0, index)} />

      <Pressable
        accessibilityRole="button"
        disabled={busy || chosen == null}
        style={[
          styles.confirmButton,
          (busy || chosen == null) && styles.confirmButtonDisabled,
        ]}
        onPress={() => chosen != null && onPick(chosen.id)}
      >
        <Text style={styles.confirmLabel}>
          {chosen == null ? 'Pick one to continue' : `Place ${chosen.name}`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...card.base,
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  panelTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
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
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  cardRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  card: {
    ...card.base,
    ...card.shadow,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.hero,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.primary.blue600,
  },
  cardLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  cardLabelActive: {
    color: colors.primary.blue700,
  },
  confirmButton: {
    ...card.shadow,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary.blue600,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border.default,
  },
  confirmLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary.blue600,
  },
  primaryButtonLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
