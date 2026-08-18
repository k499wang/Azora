import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import Icon from '../components/common/icons/Icon';
import ProgressBar from '../components/common/ProgressBar';
import SectionHeader from '../components/common/SectionHeader';
import PlacementReveal from '../features/room/PlacementReveal';
import RoomReplay from '../features/room/RoomReplay';
import { ROOM_MAX_WIDTH, getRoomWidth } from '../features/room/roomLayout';
import DailyCompleteSheet, {
  type DailyCompleteState,
} from '../features/room/DailyCompleteSheet';
import RoomPager from '../features/room/RoomPager';
import {
  RoomProgressCardView,
  describeRoomCard,
} from '../features/room/RoomProgressCard';
import DecoratePanel, {
  type DecorateState,
} from '../features/room/DecoratePanel';
import type { RoomSlot } from '../lib/room/roomProgress';
import { ROOM_SLOTS } from '../lib/room/roomProgress';
import {
  setRoomOverride,
  isRoomOverridden,
} from '../features/room/devRoomOverride';
import type { RoomClaim } from '../features/room/useRoomClaim';
import { CATEGORY_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import {
  DAYS,
  HexRoom,
  type DayKey,
  type FrameHue,
  type Picks,
} from '../features/room/RoomScene';
import {
  ROOM_SHELLS,
  ROOM_STYLES,
  type RoomShellKey,
} from '../features/room/roomShells';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { RoomLabScreenProps } from '../app/navigation';

const SHELL_PREVIEW_WIDTH = 96;
const BADGE_SIZE = 34;
const FRAME_HUES: FrameHue[] = ['sky', 'teal', 'blush'];

/** every slot filled with its first option — a room that looks lived in */
const SAMPLE_PICKS: Picks = Object.fromEntries(
  DAYS.map((day) => [day.key, day.options[0].id]),
) as Picks;

// Every state the sheet can be in, so none of them costs three real exercises.
const SHEET_CASES: { label: string; state: DailyCompleteState }[] = [
  {
    label: '1 of 3',
    state: { done: 1, unlocked: false, showBar: true, nextSlot: 'day1' },
  },
  {
    label: '2 of 3',
    state: { done: 2, unlocked: false, showBar: true, nextSlot: 'day1' },
  },
  {
    label: '3 of 3 — unlocked',
    state: { done: 3, unlocked: true, showBar: true, nextSlot: 'day1' },
  },
  {
    label: 'Already claimed',
    state: { done: 3, unlocked: false, showBar: false, nextSlot: 'day2' },
  },
  {
    label: 'Room full',
    state: { done: 3, unlocked: false, showBar: false, nextSlot: null },
  },
];

// The four things the decorate screen can be saying.
const PANEL_CASES: { label: string; state: DecorateState }[] = [
  {
    label: 'Locked — 0 done',
    state: {
      kind: 'locked',
      guidedDone: false,
      handPickedDone: false,
      breathHoldDone: false,
    },
  },
  {
    label: 'Locked — 2 done',
    state: {
      kind: 'locked',
      guidedDone: true,
      handPickedDone: true,
      breathHoldDone: false,
    },
  },
  { label: 'Claimed today', state: { kind: 'claimed' } },
  { label: 'Room finished', state: { kind: 'complete' } },
];

/** A whole fabricated room, so the real decorate screen can be opened at will. */
function fakeClaim({
  placed,
  dailiesDone,
  claimedToday,
}: {
  placed: number;
  dailiesDone: number;
  claimedToday: boolean;
}): RoomClaim {
  const decorations = ROOM_SLOTS.slice(0, placed).map((slot) => ({
    slot,
    optionId: DAYS.find((day) => day.key === slot)?.options[0].id ?? '',
    earnedLocalDate: '2026-01-01',
  }));
  const nextSlot = ROOM_SLOTS[placed] ?? null;
  const allCompleted = dailiesDone >= 3;

  return {
    room: {
      id: 'lab-room',
      floor: 1,
      shell: 'cream',
      frameHue: 'sky',
      decorations,
    },
    progress: {
      placedCount: placed,
      nextSlot,
      isComplete: nextSlot == null,
      claimedToday,
      canClaim: allCompleted && !claimedToday && nextSlot != null,
    },
    dailies: {
      todayLocalDate: '2026-01-01',
      guidedTechnique: null,
      guidedTechniqueLoading: false,
      handPickedTechnique: null,
      handPickedTechniqueLoading: false,
      guidedCompleted: dailiesDone >= 1,
      handPickedCompleted: dailiesDone >= 2,
      breathHoldCompleted: dailiesDone >= 3,
      allCompleted,
      isLoading: false,
    isSettling: false,
    },
    isLoading: false,
  };
}

const SCREEN_CASES: { label: string; claim: RoomClaim }[] = [
  {
    label: 'Ready to pick',
    claim: fakeClaim({ placed: 3, dailiesDone: 3, claimedToday: false }),
  },
  {
    label: 'Dailies unfinished',
    claim: fakeClaim({ placed: 3, dailiesDone: 1, claimedToday: false }),
  },
  {
    label: 'Claimed today',
    claim: fakeClaim({ placed: 4, dailiesDone: 3, claimedToday: true }),
  },
  {
    label: 'Last piece (6 of 7)',
    claim: fakeClaim({ placed: 6, dailiesDone: 3, claimedToday: false }),
  },
  {
    label: 'Room full',
    claim: fakeClaim({ placed: 7, dailiesDone: 3, claimedToday: false }),
  },
];

/**
 * Every state the Home card can be in — and only those. The impossible ones are
 * absent on purpose: dailies finished with a slot free *is* "piece ready", so
 * there is no separate "done but no button" case to preview.
 */
const CARD_CASES = [
  {
    label: 'Working through today',
    input: {
      isComplete: false,
      canClaim: false,
      claimedToday: false,
      dailiesDoneCount: 1,
      placedCount: 2,
    },
  },
  {
    label: 'Piece ready — dailies done, nothing placed',
    input: {
      isComplete: false,
      canClaim: true,
      claimedToday: false,
      dailiesDoneCount: 3,
      placedCount: 2,
    },
  },
  {
    label: 'Placed for today',
    input: {
      isComplete: false,
      canClaim: false,
      claimedToday: true,
      dailiesDoneCount: 3,
      placedCount: 3,
    },
  },
  {
    label: 'Floor finished',
    input: {
      isComplete: true,
      canClaim: false,
      claimedToday: false,
      dailiesDoneCount: 3,
      placedCount: 7,
    },
  },
];

const BAR_STEPS = [
  { label: '1st daily', from: 0, to: 1 / 3 },
  { label: '2nd daily', from: 1 / 3, to: 2 / 3 },
  { label: '3rd — unlock', from: 2 / 3, to: 1 },
];

/**
 * Dev-only harness for the room's animations. Gated three ways — the route is
 * only registered under `__DEV__`, the Settings entry only renders under
 * `__DEV__`, and the screen itself refuses to render outside it. See
 * `devScreens.test.mjs`, which fails if any of the three is removed.
 *
 * Every moment in the reward loop is otherwise gated behind finishing three
 * real exercises and waiting a day, which makes tuning a 600ms burst
 * impossible. Everything here is driven by props — nothing reads or writes the
 * database, so replaying a placement never spends a real day.
 */
export default function RoomLabScreen({ navigation }: RoomLabScreenProps) {
  const { width } = useWindowDimensions();
  const isDev = __DEV__;
  const roomWidth = getRoomWidth(width);

  const [dayIndex, setDayIndex] = useState(0);
  const [optionIndex, setOptionIndex] = useState(0);
  const [frameHue, setFrameHue] = useState<FrameHue>('sky');
  const [shell, setShell] = useState<RoomShellKey>('cream');
  const [revealRun, setRevealRun] = useState(0);

  const [barStep, setBarStep] = useState(0);
  const [barRun, setBarRun] = useState(0);
  const [replayRun, setReplayRun] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetCase, setSheetCase] = useState(0);
  const [hotelFloors, setHotelFloors] = useState(3);
  const [panelCase, setPanelCase] = useState(0);

  const day = DAYS[dayIndex];
  const option = day.options[optionIndex] ?? day.options[0];

  // The room the piece drops onto: every slot before this one, none after.
  const picks = Object.fromEntries(
    DAYS.slice(0, dayIndex).map((it) => [it.key, it.options[0].id]),
  ) as Picks;

  // Last line of defence: even if the route were somehow reachable in a
  // release build, there is nothing here to reach.
  if (!isDev) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <DailyCompleteSheet
        visible={sheetVisible}
        hue={CATEGORY_STYLE.calm.hue}
        character={CATEGORY_STYLE.calm.character}
        title="Nice work"
        state={SHEET_CASES[sheetCase].state}
        barFrom={
          Math.max(0, SHEET_CASES[sheetCase].state.done - 1) / 3
        }
        subtitle="Box Breathing"
        stats={[
          { label: 'Time', value: '2:00' },
          { label: 'Breaths', value: '24' },
        ]}
        onChoosePiece={() => {
          setSheetVisible(false);
          navigation.navigate('RoomDecorate', { fromLab: true });
        }}
        onDismiss={() => setSheetVisible(false)}
      />
      <AppTopBar showBack title="Room lab" showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.note}>
            Placement reveal · Picker · Panel states · Home card · Progress bar
            · Room complete · Shells · Daily sheet · Hotel · Real screens
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Placement reveal" />
          <Text style={styles.note}>
            Drop, squash, burst, label. Replays without touching the database.
          </Text>
        </View>

        <View style={styles.stage}>
          {revealRun === 0 ? (
            <HexRoom
              width={roomWidth}
              picks={picks}
              frameHue={frameHue}
              shell={ROOM_SHELLS[shell]}
            />
          ) : (
            <PlacementReveal
              key={revealRun}
              width={roomWidth}
              day={day.key as DayKey}
              option={option.id}
              picks={picks}
              frameHue={frameHue}
              shell={ROOM_SHELLS[shell]}
              onDone={() => setRevealRun(0)}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Slot</Text>
          <View style={styles.chipRow}>
            {DAYS.map((it, index) => (
              <Chip
                key={it.key}
                label={`${index + 1}`}
                selected={index === dayIndex}
                onPress={() => {
                  setDayIndex(index);
                  setOptionIndex(0);
                }}
              />
            ))}
          </View>

          <Text style={styles.label}>Frame — tints the burst</Text>
          <View style={styles.chipRow}>
            {FRAME_HUES.map((hue) => (
              <Chip
                key={hue}
                label={hue}
                selected={hue === frameHue}
                onPress={() => setFrameHue(hue)}
              />
            ))}
          </View>

          <Text style={styles.label}>Shell</Text>
          <View style={styles.chipRow}>
            {ROOM_STYLES.map((style) => (
              <Chip
                key={style.shell}
                label={style.name}
                selected={style.shell === shell}
                onPress={() => setShell(style.shell)}
              />
            ))}
          </View>

          <Button
            label={revealRun === 0 ? 'Play placement' : 'Playing…'}
            disabled={revealRun !== 0}
            onPress={() => setRevealRun((run) => run + 1)}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Picker" />
          <Text style={styles.note}>
            The decorate screen's "choose" state for the selected slot — the
            real component. Tapping a tile plays the reveal above and writes
            nothing.
          </Text>
        </View>

        <DecoratePanel
          state={{ kind: 'choose', slot: day.key as RoomSlot }}
          busy={revealRun !== 0}
          onSeeRoom={() => {}}
          onStartDaily={() => {}}
          onPick={(optionId) => {
            const index = day.options.findIndex((it) => it.id === optionId);
            if (index >= 0) setOptionIndex(index);
            setRevealRun((run) => run + 1);
          }}
        />

        <View style={styles.section}>
          <SectionHeader title="Decorate panel states" />
          <Text style={styles.note}>
            The other three things the decorate screen says. The picker above is
            the fourth.
          </Text>
          <View style={styles.chipRow}>
            {PANEL_CASES.map((option, index) => (
              <Chip
                key={option.label}
                label={option.label}
                selected={index === panelCase}
                onPress={() => setPanelCase(index)}
              />
            ))}
          </View>
        </View>

        <DecoratePanel
          state={PANEL_CASES[panelCase].state}
          onSeeRoom={() => {}}
          onStartDaily={() => {}}
          onPick={() => {}}
        />

        <View style={styles.section}>
          <SectionHeader title="Home card" />
          <Text style={styles.note}>
            The standing way back into the loop, in every state it can reach.
            Buttons navigate for real.
          </Text>
          {CARD_CASES.map((option) => (
            <View key={option.label} style={styles.cardCase}>
              <Text style={styles.label}>{option.label}</Text>
              <RoomProgressCardView
                view={describeRoomCard(option.input)}
                onAction={(route) => navigation.navigate(route, { fromLab: true })}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Progress bar" />
          <Text style={styles.note}>
            The results-screen fill, with the same haptics.
          </Text>

          <View style={styles.barRow}>
            <ProgressBar
              key={barRun}
              progress={BAR_STEPS[barStep].to}
              from={barRun === 0 ? BAR_STEPS[barStep].to : BAR_STEPS[barStep].from}
              height={12}
              style={styles.bar}
            />
            <View
              style={[
                styles.badge,
                barStep === BAR_STEPS.length - 1 && styles.badgeUnlocked,
              ]}
            >
              <Icon
                name={barStep === BAR_STEPS.length - 1 ? 'chevron-right' : 'lock'}
                size={barStep === BAR_STEPS.length - 1 ? 20 : 18}
                color={
                  barStep === BAR_STEPS.length - 1
                    ? colors.text.inverse
                    : colors.text.tertiary
                }
              />
            </View>
          </View>

          <View style={styles.chipRow}>
            {BAR_STEPS.map((step, index) => (
              <Chip
                key={step.label}
                label={step.label}
                selected={index === barStep}
                onPress={() => {
                  setBarStep(index);
                  setBarRun((run) => run + 1);
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Room complete replay" />
          <Text style={styles.note}>
            The 7/7 celebration — pieces land in paint order, then bloom.
          </Text>
        </View>

        <View style={styles.stage}>
          {replayRun === 0 ? (
            <HexRoom
              width={roomWidth}
              picks={SAMPLE_PICKS}
              frameHue={frameHue}
              shell={ROOM_SHELLS[shell]}
            />
          ) : (
            <RoomReplay
              key={replayRun}
              width={roomWidth}
              picks={SAMPLE_PICKS}
              frameHue={frameHue}
              shell={ROOM_SHELLS[shell]}
              onDone={() => setReplayRun(0)}
            />
          )}
        </View>

        <View style={styles.section}>
          <Button
            label={replayRun === 0 ? 'Play replay' : 'Playing…'}
            disabled={replayRun !== 0}
            onPress={() => setReplayRun((run) => run + 1)}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Shells" />
          <Text style={styles.note}>All six looks, fully decorated.</Text>
          <View style={styles.shellGrid}>
            {ROOM_STYLES.map((style) => (
              <View key={style.shell} style={styles.shellCell}>
                <HexRoom
                  width={SHELL_PREVIEW_WIDTH}
                  picks={SAMPLE_PICKS}
                  frameHue={style.frameHue}
                  shell={ROOM_SHELLS[style.shell]}
                />
                <Text style={styles.shellLabel}>{style.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Daily complete sheet" />
          <Text style={styles.note}>
            Solid colour block. These cases are faked, so none of them touches
            your real dailies or spends a day.
          </Text>
          <View style={styles.chipRow}>
            {SHEET_CASES.map((option, index) => (
              <Chip
                key={option.label}
                label={option.label}
                selected={index === sheetCase}
                onPress={() => setSheetCase(index)}
              />
            ))}
          </View>
          <Button label="Open sheet" onPress={() => setSheetVisible(true)} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Hotel (simulated)" />
          <Text style={styles.note}>
            Fake floors, so the pager can be seen at any size.
          </Text>
          <View style={styles.chipRow}>
            {[1, 3, 5, 8].map((count) => (
              <Chip
                key={count}
                label={`${count} floor${count === 1 ? '' : 's'}`}
                selected={count === hotelFloors}
                onPress={() => setHotelFloors(count)}
              />
            ))}
          </View>
        </View>

        <RoomPager<number>
          items={Array.from({ length: hotelFloors }, (_, i) => i + 1)}
          pageWidth={width}
          initialIndex={hotelFloors - 1}
          keyOf={(floor) => `floor-${floor}`}
          captionOf={(floor) => `Room ${floor}`}
          renderItem={(floor) => (
            <HexRoom
              width={roomWidth}
              picks={SAMPLE_PICKS}
              frameHue={ROOM_STYLES[(floor - 1) % ROOM_STYLES.length].frameHue}
              shell={
                ROOM_SHELLS[ROOM_STYLES[(floor - 1) % ROOM_STYLES.length].shell]
              }
            />
          )}
        />

        <View style={styles.section}>
          <SectionHeader title="Decorate screen — faked" />
          <Text style={styles.note}>
            Opens the real screen with an invented room. Picking plays the
            reveal and writes nothing.
          </Text>
          {SCREEN_CASES.map((option) => (
            <Button
              key={option.label}
              label={option.label}
              onPress={() => {
                setRoomOverride(option.claim);
                navigation.navigate('RoomDecorate', { fromLab: true });
              }}
            />
          ))}
          <Button
            label={
              isRoomOverridden() ? 'Clear fake room' : 'Fake room not active'
            }
            disabled={!isRoomOverridden()}
            onPress={() => setRoomOverride(null)}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Real screens" />
          <Text style={styles.note}>
            Your real data, unless a fake room is active above.
          </Text>
          <Button
            label="Open decorate screen"
            onPress={() => navigation.navigate('RoomDecorate', { fromLab: true })}
          />
          <Button
            label="Open room complete"
            onPress={() => navigation.navigate('RoomComplete', { fromLab: true })}
          />
          <Button
            label="Open hotel"
            onPress={() => navigation.navigate('Hotel', { fromLab: true })}
          />
          <Button
            label="Open next-room picker"
            onPress={() => navigation.navigate('NextRoom', { fromLab: true })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Button({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingBottom: spacing['7xl'],
    gap: margin.sectionGap,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  stage: {
    alignItems: 'center',
    minHeight: ROOM_MAX_WIDTH,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  label: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    ...card.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  chipSelected: {
    backgroundColor: colors.primary.blue100,
    borderColor: colors.primary.blue600,
  },
  chipLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  chipLabelSelected: {
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
  },
  cardCase: {
    gap: spacing.xs,
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
  shellGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  shellCell: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  shellLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  button: {
    ...card.shadow,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.primary.blue600,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
