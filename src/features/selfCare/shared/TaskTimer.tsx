import { useEffect, useMemo, useRef, type ComponentProps } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation, Keyframe, LayoutAnimationConfig, useAnimatedStyle,
  useDerivedValue, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming,
  type EntryExitAnimationFunction, type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../../../components/common/Text';
import Icon from '../../../components/common/icons/Icon';
import TaskIllustration from '../../../components/common/icons/TaskIllustration';
import LipToken, { type LipTone } from '../../plan/LipToken';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { duration, easing } from '../../../theme/motion';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { routineStepClock } from '../domain/routinePlayer';
import type { useRoutineStepTimer } from '../useRoutineStepTimer';

const DISC_WIDTH_SHARE = 0.7;
const ARC_STROKE_SHARE = 0.075;
const KNOB_SHARE = 0.3;
const ICON_SHARE = 0.25;
const TITLE_FONT_SHARE = 0.08;
const CLOCK_FONT_SHARE = 0.15;
const LINE_HEIGHT_RATIO = 1.2;
/** Twelve o'clock, so the arc grows clockwise from the top; just short of a full turn so it stays one open path. */
const ARC_START_ANGLE = -90;
const ARC_SWEEP = 359.9;
const SIDE_ICON_SIZE = 36;
const PLAY_ICON_SIZE = 28;
const DONE_SIZE = 80;
const DONE_ICON_SIZE = 32;
const DONE_TONE: LipTone = {
  face: colors.text.primary,
  lip: colors.neutral[800],
  icon: colors.text.inverse,
};
const DIGIT_ROLL_MS = 200;
const STEP_SHIFT = 16;
const PILL_PRESS_SCALE = 0.8;
const LENGTH_POP_SCALE = 1.06;
const PULSE_SCALE = 1.06;
const PULSE_MS = 700;

interface TaskTimerProps {
  title: string;
  icon: ComponentProps<typeof TaskIllustration>['name'];
  stepKey: string;
  timer: ReturnType<typeof useRoutineStepTimer>;
  minutes: number | null;
  paused: boolean;
  startLabel?: string;
  onTogglePause: () => void;
  onLess: () => void;
  onMore: () => void;
  onDone: () => void;
  onSkip?: () => void;
}

/** The same clock, minute controls, and playback controls for a task or a focus session. */
export default function TaskTimer({
  title, icon, stepKey, timer, minutes, paused, startLabel = 'Resume',
  onTogglePause, onLess, onMore, onDone, onSkip,
}: TaskTimerProps) {
  const { width } = useWindowDimensions();
  const discSize = Math.round(width * DISC_WIDTH_SHARE);
  const clockFontSize = Math.round(width * CLOCK_FONT_SHARE);
  const durationMs = minutes == null ? null : minutes * 60_000;
  const timeUp = durationMs != null && timer.fill === 0;
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  useWhileVisible(() => {
    if (timeUp && !reducedMotion) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(PULSE_SCALE, { duration: PULSE_MS, easing: easing.breathe }),
          withTiming(1, { duration: PULSE_MS, easing: easing.breathe }),
        ), -1,
      );
    }
    return () => {
      cancelAnimation(pulse);
      pulse.value = 1;
    };
  }, [timeUp, reducedMotion, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <>
      <Animated.View key={`title:${stepKey}`} entering={stepEntering} style={styles.titleBlock}>
        <Text
          style={[
            styles.title,
            { fontSize: Math.round(width * TITLE_FONT_SHARE) },
            { lineHeight: Math.round(width * TITLE_FONT_SHARE * LINE_HEIGHT_RATIO) },
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </Animated.View>

      <View style={[styles.disc, { width: discSize, height: discSize, borderRadius: discSize / 2 }]}>
        <StepArc
          size={discSize}
          stroke={Math.round(discSize * ARC_STROKE_SHARE)}
          progress={timer.progress}
          timed={durationMs != null}
        />
        <Animated.View key={`icon:${stepKey}`} entering={stepEntering}>
          <TaskIllustration
            name={icon}
            size={Math.round(discSize * ICON_SHARE)}
          />
        </Animated.View>
        <RollingClock
          text={routineStepClock(timer.seconds)}
          fontSize={clockFontSize}
          accessibilityLabel={
            durationMs == null
              ? `${routineStepClock(timer.seconds)} so far`
              : `${routineStepClock(timer.seconds)} left`
          }
        />
        {minutes == null ? null : (
          <LengthPill
            key={`length:${stepKey}`}
            minutes={minutes}
            onLess={onLess}
            onMore={onMore}
          />
        )}
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? startLabel : 'Pause'}
          hitSlop={spacing.sm}
          onPress={() => {
            triggerTapHaptic();
            onTogglePause();
          }}
          style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}
        >
          <Icon
            name={paused ? 'play-triangle' : 'pause'}
            size={paused ? PLAY_ICON_SIZE : SIDE_ICON_SIZE}
            color={colors.neutral[400]}
          />
        </Pressable>
        <Animated.View style={pulseStyle}>
          <LipToken
            size={DONE_SIZE}
            tone={DONE_TONE}
            accessibilityLabel={`Done with ${title}`}
            onPress={onDone}
          >
            <Icon bold name="check-bold" size={DONE_ICON_SIZE} color={DONE_TONE.icon} />
          </LipToken>
        </Animated.View>
        {onSkip == null ? <View style={styles.sideControl} /> : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            hitSlop={spacing.sm}
            onPress={() => {
              triggerTapHaptic();
              onSkip();
            }}
            style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}
          >
            <Icon name="skip-next" size={SIDE_ICON_SIZE} color={colors.neutral[400]} />
          </Pressable>
        )}
      </View>
    </>
  );
}

const stepEntering: EntryExitAnimationFunction = () => {
  'worklet';
  const config = { duration: duration.base, easing: easing.enter };
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateX: STEP_SHIFT }],
    },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ translateX: withTiming(0, config) }],
    },
  };
};

interface StepArcProps {
  size: number;
  stroke: number;
  progress: SharedValue<number>;
  /** an open-ended step keeps the ring but has no time to fill it with */
  timed: boolean;
}

/** Grows clockwise from twelve o'clock, with a knob riding its leading end. */
function StepArc({ size, stroke, progress, timed }: StepArcProps) {
  const center = size / 2;
  const radius = center - stroke / 2;
  const path = useMemo(() => {
    const circle = Skia.Path.Make();
    circle.addArc(
      Skia.XYWHRect(center - radius, center - radius, radius * 2, radius * 2),
      ARC_START_ANGLE,
      ARC_SWEEP,
    );
    return circle;
  }, [center, radius]);
  const knobX = useDerivedValue(
    () => center + radius * Math.cos(-Math.PI / 2 + 2 * Math.PI * progress.value),
  );
  const knobY = useDerivedValue(
    () => center + radius * Math.sin(-Math.PI / 2 + 2 * Math.PI * progress.value),
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Circle
        cx={center}
        cy={center}
        r={radius}
        style="stroke"
        strokeWidth={stroke}
        color={colors.primary.blue100}
      />
      {timed ? (
        <>
          <Path
            path={path}
            style="stroke"
            strokeWidth={stroke}
            strokeCap="round"
            color={colors.primary.blue500}
            start={0}
            end={progress}
          />
          <Circle cx={knobX} cy={knobY} r={stroke * KNOB_SHARE} color={colors.neutral[0]} />
        </>
      ) : null}
    </Canvas>
  );
}

interface RollingClockProps {
  text: string;
  fontSize: number;
  accessibilityLabel: string;
}

/** Each character rolls up out of its slot when it changes; the rest stay still. */
function RollingClock({ text, fontSize, accessibilityLabel }: RollingClockProps) {
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO);
  const [rollIn, rollOut] = useMemo(
    () => [
      new Keyframe({
        0: { opacity: 0, transform: [{ translateY: lineHeight }] },
        100: { opacity: 1, transform: [{ translateY: 0 }], easing: easing.enter },
      }).duration(DIGIT_ROLL_MS),
      new Keyframe({
        0: { opacity: 1, transform: [{ translateY: 0 }] },
        100: { opacity: 0, transform: [{ translateY: -lineHeight }], easing: easing.exit },
      }).duration(DIGIT_ROLL_MS),
    ],
    [lineHeight],
  );
  const textStyle = [styles.clock, { fontSize, lineHeight }];

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.clockRow}>
      <LayoutAnimationConfig skipEntering>
        {text.split('').map((char, index) => (
          <View key={index} style={[styles.clockSlot, { height: lineHeight }]}>
            <Text style={[textStyle, styles.clockSizer]}>{char}</Text>
            <Animated.View
              key={char}
              entering={rollIn}
              exiting={rollOut}
              style={styles.clockGlyph}
            >
              <Text style={textStyle}>{char}</Text>
            </Animated.View>
          </View>
        ))}
      </LayoutAnimationConfig>
    </View>
  );
}

interface LengthPillProps {
  minutes: number;
  onLess: () => void;
  onMore: () => void;
}

function LengthPill({ minutes, onLess, onMore }: LengthPillProps) {
  const pop = useSharedValue(1);
  const shown = useRef(minutes);
  useEffect(() => {
    if (shown.current === minutes) return;
    shown.current = minutes;
    pop.value = withSequence(
      withTiming(LENGTH_POP_SCALE, { duration: duration.fast }),
      withTiming(1, { duration: duration.fast }),
    );
    return () => cancelAnimation(pop);
  }, [minutes, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.pill}>
      <PillStep
        label="−"
        accessibilityLabel="One minute less"
        disabled={minutes <= 1}
        onPress={onLess}
      />
      <Animated.View style={popStyle}>
        <Text style={styles.pillValue}>{`${minutes}m`}</Text>
      </Animated.View>
      <PillStep label="+" accessibilityLabel="One minute more" onPress={onMore} />
    </View>
  );
}

interface PillStepProps {
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}

function PillStep({ label, accessibilityLabel, disabled = false, onPress }: PillStepProps) {
  const scale = useSharedValue(1);
  useEffect(() => () => cancelAnimation(scale), [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.sm}
      onPressIn={() => {
        scale.value = withTiming(PILL_PRESS_SCALE, { duration: duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: duration.fast });
      }}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
    >
      <Animated.View style={style}>
        <Text style={[styles.pillStep, disabled && styles.pillStepDisabled]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  titleBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'center',
  },
  disc: {
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.card,
  },
  clockRow: {
    flexDirection: 'row',
  },
  clockSlot: {
    overflow: 'hidden',
  },
  clockSizer: {
    opacity: 0,
  },
  clockGlyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  pillStep: {
    ...typography.body.large,
    color: colors.text.tertiary,
  },
  pillStepDisabled: {
    opacity: 0.4,
  },
  pillValue: {
    ...typography.body.large,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3xl'],
    marginTop: spacing.xl,
  },
  sideControl: {
    width: SIDE_ICON_SIZE,
    height: SIDE_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
