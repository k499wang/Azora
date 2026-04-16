import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import BreathingCircle, {
  BreathingCircleRef,
} from '../components/exercise/BreathingCircle';
import ExerciseScaffold from '../components/exercise/ExerciseScaffold';

type HoldPhase = 'idle' | 'inhale' | 'hold' | 'done';

const PHASE_LABELS: Record<HoldPhase, string> = {
  idle: 'Daily Hold',
  inhale: 'Inhale',
  hold: 'Hold',
  done: 'Released',
};

export default function DailyExercisePage() {
  const navigation = useNavigation<any>();
  const circleRef = useRef<BreathingCircleRef>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [bestHoldSeconds, setBestHoldSeconds] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startInhale = () => {
    clearTimer();
    setHoldSeconds(0);
    setPhase('inhale');
    circleRef.current?.reset();
    circleRef.current?.expand(6);
  };

  const beginHold = () => {
    clearTimer();
    setHoldSeconds(0);
    setPhase('hold');
    timerRef.current = setInterval(() => {
      setHoldSeconds((current) => current + 1);
    }, 1000);
  };

  const releaseHold = () => {
    clearTimer();
    setBestHoldSeconds((current) => Math.max(current, holdSeconds));
    setPhase('done');
  };

  const handlePrimaryPress = () => {
    if (phase === 'idle' || phase === 'done') {
      startInhale();
      return;
    }

    if (phase === 'inhale') {
      beginHold();
      return;
    }

    releaseHold();
  };

  const handleViewResults = () => {
    navigation.navigate('DailyResult', {
      holdSeconds,
    });
  };

  const primaryLabel =
    phase === 'idle'
      ? 'Start Inhale'
      : phase === 'inhale'
        ? 'Begin Hold'
        : phase === 'hold'
          ? 'Release'
          : 'Try Again';

  const guidance =
    phase === 'idle'
      ? 'Take one full breath in, then hold until you are ready to breathe.'
      : phase === 'inhale'
        ? 'Fill your lungs gently. Begin the hold when your inhale feels complete.'
        : phase === 'hold'
          ? 'Hold until you are ready to breathe. Release when it stops feeling controlled.'
          : 'Nice work. Rest for a moment, then begin again when you feel ready.';

  const displayTime = phase === 'hold' || phase === 'done' ? formatTime(holdSeconds) : null;

  return (
    <ExerciseScaffold
      titleSlot={
        <View style={styles.patternRow}>
          {[
            { key: 'inhale', icon: 'arrow-up' as const, label: '6s' },
            { key: 'hold',   icon: 'dots-horizontal' as const, label: '∞' },
          ].map((p, i, arr) => (
            <View key={p.key} style={styles.patternItem}>
              <View style={styles.patternCircle}>
                <MaterialCommunityIcons name={p.icon} size={24} color={colors.text.secondary} />
              </View>
              <Text style={styles.patternSecs}>{p.label}</Text>
              {i < arr.length - 1 && <View style={styles.patternConnector} />}
            </View>
          ))}
        </View>
      }
      centerSlot={
        <BreathingCircle ref={circleRef}>
          {phase !== 'idle' ? <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text> : null}
          {displayTime ? <Text style={styles.countdown}>{displayTime}</Text> : null}
        </BreathingCircle>
      }
      bottomSlot={
        <View style={styles.bottomContainer}>
          <View style={styles.guidanceWrap}>
            <Text style={styles.guidance}>{guidance}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
            onPress={handlePrimaryPress}
          >
            <MaterialCommunityIcons
              name={
                phase === 'idle' || phase === 'done' ? 'play' :
                phase === 'inhale' ? 'chevron-right' : 'hand-back-left-outline'
              }
              size={28}
              color={colors.neutral[900]}
            />
          </Pressable>
          <Pressable
            pointerEvents={phase === 'done' ? 'auto' : 'none'}
            style={({ pressed }) => [styles.viewResultsButton, pressed && styles.circleBtnPressed, phase !== 'done' && styles.viewResultsHidden]}
            onPress={handleViewResults}
          >
            <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary.blue600} style={{ marginRight: spacing.xs }} />
            <Text style={styles.viewResultsText}>View Results</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  patternItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  patternCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternSecs: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  patternConnector: {
    position: 'absolute',
    top: 25,
    right: -spacing.sm,
    width: spacing.sm,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  guidanceWrap: {
    minHeight: 66,
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  circleBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  viewResultsHidden: {
    opacity: 0,
  },
  phaseLabel: {
    ...typography.title.title3,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  countdown: {
    ...typography.display.display1,
    color: colors.text.primary,
  },
  guidance: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accentSoft,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary.blue400,
  },
  viewResultsText: {
    ...typography.button.large,
    color: colors.primary.blue600,
  },
});
