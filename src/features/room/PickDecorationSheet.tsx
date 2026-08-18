import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/Text';
import ChunkyButton, {
  CHUNKY_TONE_QUIET,
} from '../../components/common/ChunkyButton';
import { DecorationSolo } from './roomStage';
import { getRoomDay } from './roomDays';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { RoomSlot } from '../../lib/room/roomProgress';

/**
 * A square tile, a square well, a square drawing — all three, or the art lands
 * off-centre by exactly the difference. Decorations run from 0.76 to 1.62 in
 * aspect, so each is fitted to its box rather than to itself.
 *
 * The well is tinted because several pieces are white or near-white — the
 * cloud rug is white on pale grey — and vanish on a white card. They are
 * authored to sit on a warm floor, not on paper.
 */
const TILE_PAD = spacing.sm;
const WELL_SIZE = 116;
const ART_SIZE = WELL_SIZE - spacing.xs * 2;

interface PickDecorationSheetProps {
  visible: boolean;
  slot: RoomSlot;
  /** the write is in flight — confirming twice would place two pieces */
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (optionId: string) => void;
}

/**
 * Choosing what goes in the room's empty slot.
 *
 * It opens from the "+" standing in that slot, so the question is already
 * anchored to a place — which is why nothing here says where the piece lands.
 * Selecting and confirming are two presses, because placing is irreversible
 * for the day and a grid of tiles is easy to brush.
 */
export default function PickDecorationSheet({
  visible,
  slot,
  busy = false,
  onCancel,
  onConfirm,
}: PickDecorationSheetProps) {
  const insets = useSafeAreaInsets();
  const day = getRoomDay(slot);
  const options = day?.options ?? [];
  const [selected, setSelected] = useState<string | null>(null);

  // Every opening starts from nothing chosen: a selection carried over from
  // last time would be a piece the user never looked at, one press from placed.
  useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  const chosen = options.find((option) => option.id === selected) ?? null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          onPress={() => {}}
        >
          <Text style={styles.title}>Pick an item to add</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const active = option.id === selected;

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.name}
                  style={[styles.tile, active && styles.tileActive]}
                  onPress={() => {
                    triggerTapHaptic();
                    setSelected(option.id);
                  }}
                >
                  <View style={styles.well}>
                    <DecorationSolo
                      width={ART_SIZE}
                      height={ART_SIZE}
                      day={slot}
                      option={option.id}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.tileLabel, active && styles.tileLabelActive]}
                  >
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ChunkyButton
            label={chosen == null ? 'Pick one to continue' : `Place ${chosen.name}`}
            shape="card"
            disabled={busy || chosen == null}
            onPress={() => chosen != null && onConfirm(chosen.id)}
          />
          <ChunkyButton
            label="Cancel"
            shape="card"
            tone={CHUNKY_TONE_QUIET}
            haptic="tap"
            style={styles.cancel}
            onPress={onCancel}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay.dark,
  },
  sheet: {
    ...card.base,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '82%',
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title.title2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    ...card.base,
    flexBasis: '48%',
    padding: TILE_PAD,
    gap: spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  tileActive: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue100,
  },
  well: {
    ...card.well,
    width: '100%',
    height: WELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  tileLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
  },
  tileLabelActive: {
    color: colors.text.primary,
  },
  cancel: {
    marginTop: -spacing.xs,
  },
});
