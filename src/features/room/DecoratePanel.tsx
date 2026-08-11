import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import PagerDots from '../../components/common/PagerDots';
import ChunkyButton from '../../components/common/ChunkyButton';
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

const SLIDE_HEIGHT = 190;
/** the drawing inside a slide, inset from the page edges */
const ART_WIDTH = 200;

/**
 * Swipe through the options, then confirm.
 *
 * One option per page: the option you are looking at is the one you have
 * chosen, so there is nothing to tap and nothing to mis-tap. The earlier
 * version was a row of tappable cards over a snapping scroller, where a tap and
 * the snap both wanted to decide the selection and the scroller won — tapping
 * one card could leave another selected.
 *
 * Confirming is still its own press, because placing is irreversible for the
 * day. Each option is drawn on its own rather than sitting in the room: at
 * thumbnail size the room is what you see and the object is a speck.
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
  const { width } = useWindowDimensions();
  const day = getRoomDay(slot);
  const options = day?.options ?? [];
  const first = options[0]?.id ?? null;

  // The lab renders this panel without owning the selection. Falling back to
  // local state keeps the dots and the label following the swipe there.
  const [local, setLocal] = useState<string | null>(null);
  const active = selected ?? local ?? first;

  // A page is always centred, so something is always chosen — including before
  // the first swipe. Told upwards so the room previews it straight away.
  useEffect(() => {
    if (selected == null && first != null) onSelect?.(first);
  }, [first, onSelect, selected]);

  if (day == null) {
    return null;
  }

  const index = Math.max(
    0,
    options.findIndex((option) => option.id === active),
  );
  const chosen = options[index];

  const settle = (at: number) => {
    const option = options[at];
    if (option == null || option.id === active) return;

    triggerTapHaptic();
    setLocal(option.id);
    onSelect?.(option.id);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pick your decoration</Text>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={[styles.slider, { marginHorizontal: -padding.screen.horizontal }]}
        onMomentumScrollEnd={(event) =>
          settle(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {options.map((option) => (
          <View
            key={option.id}
            accessibilityRole="image"
            accessibilityLabel={option.name}
            style={[styles.slide, { width }]}
          >
            <View style={styles.art}>
              <DecorationSolo
                width={ART_WIDTH}
                height={SLIDE_HEIGHT - spacing.xl}
                day={slot}
                option={option.id}
              />
            </View>
            <Text style={styles.slideLabel}>{option.name}</Text>
          </View>
        ))}
      </ScrollView>

      <PagerDots count={options.length} index={index} />

      <ChunkyButton
        label={chosen == null ? 'Pick one to continue' : `Place ${chosen.name}`}
        shape="card"
        disabled={busy || chosen == null}
        style={styles.confirmButton}
        onPress={() => chosen != null && onPick(chosen.id)}
      />
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
  slider: {
    marginVertical: spacing.sm,
  },
  slide: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  art: {
    ...card.base,
    ...card.shadow,
    height: SLIDE_HEIGHT,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.hero,
  },
  slideLabel: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  confirmButton: {
    marginTop: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
});
