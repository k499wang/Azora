import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerLightHaptic } from '../../native/tapHaptics';
import StreakFlameHero from './StreakFlameHero';
import StreakWeekRow from './StreakWeekRow';
import {
  routineStreakCount,
  routineStreakSubtitle,
  routineStreakWeekSlots,
  streakOdometerDigits,
  type StreakOdometerColumn,
} from './domain/routineFirstCompletion';
import { easeInOutCubic, easeOutCubic, phase, streakCelebrationMotion as timing } from './streakCelebrationMotion';

interface Props {
  streakDays: number;
  completedDaysAgo: readonly number[];
  active: boolean;
  onIgnite: () => void;
  onContinue: () => void;
}

const palette = colors.streakCelebration;
const COUNT_HEIGHT = 104;
const COUNT_BLEED = 16;
const COUNT_ROLL = COUNT_HEIGHT + COUNT_BLEED * 2;

/** The earned count is the focal point; the week and action rise in under it once it lands. */
export default function StreakExtendStep({
  streakDays,
  completedDaysAgo,
  active,
  onIgnite,
  onContinue,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [today] = useState(() => new Date().getDay());
  const count = routineStreakCount(streakDays);
  const columns = streakOdometerDigits(count - 1, count);
  const slots = useMemo(() => routineStreakWeekSlots(today, completedDaysAgo), [completedDaysAgo, today]);
  const todayFilled = slots[slots.length - 1].filled;
  const [ready, setReady] = useState(reducedMotion);
  const clock = useSharedValue<number>(reducedMotion ? timing.end : 0);
  const liftOffset = useSharedValue(0);
  const onIgniteRef = useRef(onIgnite);
  useEffect(() => {
    onIgniteRef.current = onIgnite;
  }, [onIgnite]);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      clock.value = timing.end;
      setReady(true);
      onIgniteRef.current();
      triggerLightHaptic();
      return;
    }
    setReady(false);
    clock.value = 0;
    clock.value = withTiming(timing.end, { duration: timing.end, easing: Easing.linear });
    const cancels = [
      startUiTimer(timing.landAt, () => {
        onIgniteRef.current();
        triggerLightHaptic();
      }),
      ...(todayFilled ? [startUiTimer(timing.checkAt, triggerLightHaptic)] : []),
      startUiTimer(timing.continueAt + timing.continueDuration, () => setReady(true)),
    ];
    return () => {
      cancels.forEach(cancel => cancel());
      cancelAnimation(clock);
    };
    // Completion history is a snapshot for this celebration; leaving cancels the schedule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion]);

  const onLowerLayout = (event: LayoutChangeEvent) => {
    liftOffset.value = event.nativeEvent.layout.height / 2;
  };
  const stackStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY:
        liftOffset.value * (1 - easeOutCubic(phase(clock.value, timing.liftAt, timing.liftDuration))),
    }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: easeInOutCubic(phase(clock.value, timing.labelAt, timing.labelDuration)),
  }));
  const weekStyle = useClockReveal(clock, timing.weekAt, timing.revealDuration, 12);
  const copyStyle = useClockReveal(clock, timing.copyAt, timing.revealDuration, 12);
  const continueStyle = useClockReveal(clock, timing.continueAt, timing.continueDuration, 24);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.space} />
        <Animated.View style={[styles.stack, stackStyle]}>
          <StreakFlameHero clock={clock} active={active} reducedMotion={reducedMotion} />
          <View style={styles.countBlock} accessible accessibilityLabel={`${count} day streak`}>
            <View style={styles.countRow}>
              {columns.map((column, index) => (
                <OdometerColumn key={index} clock={clock} column={column} />
              ))}
            </View>
            <Animated.View style={labelStyle}>
              <Text style={styles.countLabel}>day streak</Text>
            </Animated.View>
          </View>
          <View style={styles.lower} onLayout={onLowerLayout}>
            <Animated.View style={weekStyle}>
              <StreakWeekRow clock={clock} slots={slots} />
            </Animated.View>
            <Animated.View style={[styles.copy, copyStyle]}>
              <Text style={styles.subtitle}>{routineStreakSubtitle(streakDays)}</Text>
            </Animated.View>
          </View>
        </Animated.View>
        <View style={styles.space} />
      </View>
      <Animated.View
        style={[styles.continue, continueStyle]}
        pointerEvents={ready && active ? 'auto' : 'none'}
        accessibilityElementsHidden={!ready || !active}
        importantForAccessibility={ready && active ? 'auto' : 'no-hide-descendants'}
      >
        <ChunkyButton label="CONTINUE" onPress={onContinue} shape="card" minHeight={48} />
      </Animated.View>
    </View>
  );
}

function useClockReveal(clock: SharedValue<number>, at: number, duration: number, distance: number) {
  return useAnimatedStyle(() => {
    const progress = easeOutCubic(phase(clock.value, at, duration));
    return { opacity: progress, transform: [{ translateY: (1 - progress) * distance }] };
  });
}

interface OdometerColumnProps {
  clock: SharedValue<number>;
  column: StreakOdometerColumn;
}

function OdometerColumn({ clock, column }: OdometerColumnProps) {
  const outgoingStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: -COUNT_ROLL * easeOutCubic(phase(clock.value, timing.landAt, timing.countDuration)),
    }],
  }));
  const incomingStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY:
        COUNT_ROLL * (1 - easeOutCubic(phase(clock.value, timing.landAt, timing.countDuration))),
    }],
  }));
  if (column.from === column.to) return <CountDigits clock={clock} digits={column.to} />;
  // The window clips only the roll: it is sized to the wider of both values and
  // bleeds past the line box, so glyph overhang is never cut.
  return (
    <View style={styles.countColumn}>
      <View style={styles.countSizer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.Text allowFontScaling={false} style={styles.countDigits}>{column.from}</Animated.Text>
        <Animated.Text allowFontScaling={false} style={[styles.countDigits, styles.countSizerStacked]}>{column.to}</Animated.Text>
      </View>
      <Animated.View style={[styles.countLayer, incomingStyle]}>
        <CountDigits clock={clock} digits={column.to} />
      </Animated.View>
      <Animated.View style={[styles.countLayer, outgoingStyle]}>
        <CountDigits clock={clock} digits={column.from} />
      </Animated.View>
    </View>
  );
}

interface CountDigitsProps {
  clock: SharedValue<number>;
  digits: string;
}

function CountDigits({ clock, digits }: CountDigitsProps) {
  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      easeOutCubic(phase(clock.value, timing.landAt, timing.countDuration)),
      [0, 1],
      [palette.dormantCore, palette.count],
    ),
  }));
  return (
    <Animated.Text allowFontScaling={false} style={[styles.countDigits, colorStyle]}>
      {digits}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 24 },
  content: { flex: 1, width: '100%', maxWidth: 460, alignItems: 'center' },
  space: { flex: 1, minHeight: 18 },
  stack: { width: '100%', alignItems: 'center' },
  countBlock: { width: '100%', alignItems: 'center' },
  countRow: { flexDirection: 'row', justifyContent: 'center' },
  countColumn: { padding: COUNT_BLEED, margin: -COUNT_BLEED, overflow: 'hidden' },
  countSizer: { opacity: 0 },
  countSizerStacked: { marginTop: -COUNT_HEIGHT },
  countLayer: { position: 'absolute', top: COUNT_BLEED, left: COUNT_BLEED, right: COUNT_BLEED },
  countDigits: {
    fontFamily: fonts.semibold,
    fontSize: 96,
    lineHeight: COUNT_HEIGHT,
    textAlign: 'center',
  },
  countLabel: { fontFamily: fonts.semibold, fontSize: 27, lineHeight: 34, color: palette.label },
  lower: { width: '100%', paddingTop: 42 },
  copy: { marginTop: 28, maxWidth: 330, alignSelf: 'center' },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 19,
    lineHeight: 28,
    color: palette.copy,
    textAlign: 'center',
  },
  continue: { width: '100%', maxWidth: 460, paddingBottom: 8 },
});
