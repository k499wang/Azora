import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import {
  HeartRatePlacementGuidance,
  HeartRateSignalWarning,
} from './ExerciseHeartRateGuidance';
import type { FingerPlacementState, SignalStatus } from '../../lib/heartRate/types';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const CUE_FADE_OUT_MS = 280;
const CUE_FADE_IN_MS = 360;

interface BreathCuePart {
  text: string;
  emphasis?: boolean;
}

const HOLD_CUE_PARTS: BreathCuePart[] = [
  { text: 'Hold', emphasis: true },
  { text: ' your breath for ' },
  { text: 'as long as you can', emphasis: true },
  { text: '. ' },
  { text: 'Tap the screen', emphasis: true },
  { text: ' when you need to breathe.' },
];

interface DailyBreathHoldGuidanceProps {
  placementActive: boolean;
  liveActive: boolean;
  holdActive: boolean;
  theme: ExerciseDarkTheme;
  heartRateActive: boolean;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

export function DailyBreathHoldGuidance({
  placementActive,
  liveActive,
  holdActive,
  theme,
  heartRateActive,
  fingerPlacement,
  signalStatus,
}: DailyBreathHoldGuidanceProps) {
  const cueOpacity = useRef(new Animated.Value(0)).current;
  const [displayedCue, setDisplayedCue] = useState<BreathCuePart[] | null>(null);
  const displayedCueKeyRef = useRef<string | null>(null);
  const activeCue = holdActive ? HOLD_CUE_PARTS : null;
  const activeCueKey = holdActive ? 'hold' : null;

  useEffect(() => {
    if (activeCueKey === displayedCueKeyRef.current) return;

    if (displayedCueKeyRef.current === null) {
      displayedCueKeyRef.current = activeCueKey;
      setDisplayedCue(activeCue);
      cueOpacity.setValue(0);
      Animated.timing(cueOpacity, {
        toValue: 1,
        duration: CUE_FADE_IN_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      return;
    }

    let cancelled = false;
    Animated.timing(cueOpacity, {
      toValue: 0,
      duration: CUE_FADE_OUT_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || cancelled) return;
      displayedCueKeyRef.current = activeCueKey;
      setDisplayedCue(activeCue);
      if (activeCueKey === null) return;
      Animated.timing(cueOpacity, {
        toValue: 1,
        duration: CUE_FADE_IN_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      cancelled = true;
    };
  }, [activeCue, activeCueKey, cueOpacity]);

  return (
    <View style={styles.belowSlot} pointerEvents="none">
      {placementActive ? (
        <HeartRatePlacementGuidance
          theme={theme}
          fingerPlacement={fingerPlacement}
          signalStatus={signalStatus}
        />
      ) : liveActive ? (
        <View style={styles.metricStack}>
          {displayedCue != null ? (
            <Animated.View style={{ opacity: cueOpacity }}>
              <Text style={[styles.holdMicroCopy, { color: theme.textSecondary }]}>
                {displayedCue.map((part, index) => (
                  <Text
                    key={index}
                    style={
                      part.emphasis
                        ? [styles.holdMicroCopyEmphasis, { color: theme.textPrimary }]
                        : undefined
                    }
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
            </Animated.View>
          ) : null}
          <HeartRateSignalWarning
            active={heartRateActive}
            fingerPlacement={fingerPlacement}
            signalStatus={signalStatus}
            style={styles.warningSpacing}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  belowSlot: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  metricStack: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningSpacing: {
    marginTop: 2,
  },
  holdMicroCopy: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    maxWidth: 320,
  },
  holdMicroCopyEmphasis: {
    fontFamily: fonts.bold,
  },
});
