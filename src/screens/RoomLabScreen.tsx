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

const MAX_ROOM_WIDTH = 300;
const SHELL_PREVIEW_WIDTH = 96;
const BADGE_SIZE = 34;
const FRAME_HUES: FrameHue[] = ['sky', 'teal', 'blush'];

/** every slot filled with its first option — a room that looks lived in */
const SAMPLE_PICKS: Picks = Object.fromEntries(
  DAYS.map((day) => [day.key, day.options[0].id]),
) as Picks;

const BAR_STEPS = [
  { label: '1st daily', from: 0, to: 1 / 3 },
  { label: '2nd daily', from: 1 / 3, to: 2 / 3 },
  { label: '3rd — unlock', from: 2 / 3, to: 1 },
];

/**
 * Dev-only harness for the room's animations.
 *
 * Every moment in the reward loop is otherwise gated behind finishing three
 * real exercises and waiting a day, which makes tuning a 600ms burst
 * impossible. Everything here is driven by props — nothing reads or writes the
 * database, so replaying a placement never spends a real day.
 */
export default function RoomLabScreen({ navigation }: RoomLabScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = width - padding.screen.horizontal * 2;
  const roomWidth = Math.min(contentWidth, MAX_ROOM_WIDTH);

  const [dayIndex, setDayIndex] = useState(0);
  const [optionIndex, setOptionIndex] = useState(0);
  const [frameHue, setFrameHue] = useState<FrameHue>('sky');
  const [shell, setShell] = useState<RoomShellKey>('cream');
  const [revealRun, setRevealRun] = useState(0);

  const [barStep, setBarStep] = useState(0);
  const [barRun, setBarRun] = useState(0);
  const [replayRun, setReplayRun] = useState(0);

  const day = DAYS[dayIndex];
  const option = day.options[optionIndex] ?? day.options[0];

  // The room the piece drops onto: every slot before this one, none after.
  const picks = Object.fromEntries(
    DAYS.slice(0, dayIndex).map((it) => [it.key, it.options[0].id]),
  ) as Picks;

  return (
    <View style={styles.screen}>
      <AppTopBar title="Room lab" showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
              optionName={option.name}
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

          <Text style={styles.label}>{day.title}</Text>
          <View style={styles.chipRow}>
            {day.options.map((it, index) => (
              <Chip
                key={it.id}
                label={it.name}
                selected={index === optionIndex}
                onPress={() => setOptionIndex(index)}
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
          <SectionHeader title="Real screens" />
          <Text style={styles.note}>
            These read your actual room, so they show real progress.
          </Text>
          <Button
            label="Open decorate screen"
            onPress={() => navigation.navigate('RoomDecorate')}
          />
          <Button
            label="Open room complete"
            onPress={() => navigation.navigate('RoomComplete')}
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
    minHeight: MAX_ROOM_WIDTH,
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
