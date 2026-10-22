import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FocusTimerScreenProps } from '../app/navigation';
import Icon from '../components/common/icons/Icon';
import { Text } from '../components/common/Text';
import TaskTimer from '../features/selfCare/shared/TaskTimer';
import { useTaskTimerAlert } from '../features/selfCare/shared/useTaskTimerAlert';
import { useTimerKeepAwake } from '../features/selfCare/shared/useTimerKeepAwake';
import { useRoutineStepTimer } from '../features/selfCare/useRoutineStepTimer';
import { triggerSoftHaptic, triggerTapHaptic } from '../native/tapHaptics';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function FocusTimerScreen({ navigation }: FocusTimerScreenProps) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [minutes, setMinutes] = useState(25);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);
  const timer = useRoutineStepTimer({
    active: focused,
    paused,
    durationMs: minutes * 60_000,
    stepKey: 'focus',
    onElapsed: triggerSoftHaptic,
  });
  useTimerKeepAwake('focus-timer', started && !paused && timer.fill > 0);
  useTaskTimerAlert({
    kind: 'focus',
    title: 'Focus Timer',
    seconds: timer.seconds,
    active: started && !paused && timer.fill > 0,
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={spacing.sm}
          onPress={() => { triggerTapHaptic(); navigation.goBack(); }}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Icon name="close" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <TaskTimer
          title="Focus Timer"
          icon="timer"
          stepKey="focus"
          timer={timer}
          minutes={minutes}
          paused={paused}
          startLabel={started ? 'Resume' : 'Start'}
          onTogglePause={() => {
            setStarted(true);
            setPaused((current) => !current);
          }}
          onLess={() => setMinutes((current) => Math.max(1, current - 1))}
          onMore={() => setMinutes((current) => current + 1)}
          onDone={() => navigation.goBack()}
        />
        <Text style={styles.hint}>
          {!started ? 'Choose your time, then press play.' : timer.fill === 0 ? 'Time’s up. Take a moment to reset.' : paused ? 'Paused. Pick up when you’re ready.' : 'One thing at a time.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas, paddingHorizontal: padding.screen.horizontal },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: spacing.sm },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[100] },
  pressed: { opacity: 0.6 },
  body: { flex: 1, alignItems: 'center' },
  hint: { ...typography.body.medium, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl },
});
