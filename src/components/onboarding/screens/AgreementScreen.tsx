import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

export type AgreementValue = 'disagree' | 'neutral' | 'agree';

export const AGREEMENT_STATEMENTS: { id: string; text: string }[] = [
  { id: 'exhausted', text: 'I often feel mentally exhausted.' },
  { id: 'racing', text: 'I struggle to slow my mind down.' },
  { id: 'reactive', text: 'Small things stress me out more than they should.' },
];

const SCALE: { value: AgreementValue; label: string; size: number }[] = [
  { value: 'disagree', label: 'Disagree', size: 56 },
  { value: 'neutral', label: 'Neutral', size: 44 },
  { value: 'agree', label: 'Agree', size: 56 },
];

const ADVANCE_DELAY_MS = 320;

interface AgreementScreenProps {
  responses: Record<string, AgreementValue | null>;
  stepIndex: number;
  stepCount: number;
  onChange: (id: string, value: AgreementValue) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function AgreementScreen({
  responses,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: AgreementScreenProps) {
  const firstUnanswered = AGREEMENT_STATEMENTS.findIndex(
    (s) => responses[s.id] == null,
  );
  const [currentIdx, setCurrentIdx] = useState(
    firstUnanswered === -1 ? 0 : firstUnanswered,
  );
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const total = AGREEMENT_STATEMENTS.length;
  const statement = AGREEMENT_STATEMENTS[currentIdx];
  const currentValue = responses[statement.id];

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(12);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIdx, fade, slide]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const goToNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onContinue();
    }
  };

  const handleSelect = (value: AgreementValue) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onChange(statement.id, value);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goToNext, ADVANCE_DELAY_MS);
  };

  const handleBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (currentIdx === 0) {
      onBack();
    } else {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const subProgress = (stepIndex + currentIdx / total) / stepCount;

  return (
    <OnboardingScreenLayout
      title="Does any of this sound like you?"
      subtitle={`${currentIdx + 1} of ${total}`}
      progress={subProgress}
      onBack={handleBack}
      footer={<View />}
    >
      <Animated.View
        style={[
          styles.stage,
          { opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <View style={styles.statementWrap}>
          <Text style={styles.statement}>{statement.text}</Text>
        </View>

        <View style={styles.scaleWrap}>
          <View style={styles.axis}>
            {SCALE.map((opt) => {
              const selected = currentValue === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected }}
                  hitSlop={10}
                  onPress={() => handleSelect(opt.value)}
                  style={styles.dotColumn}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        width: opt.size,
                        height: opt.size,
                        borderRadius: opt.size / 2,
                      },
                      selected && styles.dotSelected,
                    ]}
                  >
                    {selected ? <View style={styles.dotInner} /> : null}
                  </View>
                  <Text
                    style={[styles.dotLabel, selected && styles.dotLabelSelected]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing['3xl'],
    paddingVertical: spacing['2xl'],
  },
  statementWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  statement: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scaleWrap: {
    alignItems: 'center',
  },
  axis: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  dotColumn: {
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSelected: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue600,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text.inverse,
  },
  dotLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dotLabelSelected: {
    color: colors.text.primary,
  },
});
