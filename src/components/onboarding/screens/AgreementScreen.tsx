import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

export type AgreementValue = 'agree' | 'disagree';

export const AGREEMENT_STATEMENTS: {
  id: string;
  text: string;
  image?: ImageSourcePropType;
}[] = [
  {
    id: 'exhausted',
    text: 'I often feel mentally exhausted.',
    image: require('../../../../assets/questions/q1.png'),
  },
  {
    id: 'racing',
    text: 'I struggle to slow my mind down.',
    image: require('../../../../assets/questions/q2.png'),
  },
  {
    id: 'reactive',
    text: 'Small things stress me out more than they should.',
    image: require('../../../../assets/questions/q3.png'),
  },
];

const CHOICES: { value: AgreementValue; label: string }[] = [
  { value: 'disagree', label: 'No' },
  { value: 'agree', label: 'Yes' },
];

const ADVANCE_DELAY_MS = 0;

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

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  const total = AGREEMENT_STATEMENTS.length;
  const statement = AGREEMENT_STATEMENTS[currentIdx];
  const currentValue = responses[statement.id];

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(16);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 420,
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

  const choicesRow = (
    <View style={styles.choices}>
      {CHOICES.map((opt) => {
        const selected = currentValue === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected }}
            onPress={() => handleSelect(opt.value)}
            style={({ pressed }) => [
              styles.choice,
              selected && styles.choiceSelected,
              pressed && !selected && styles.choicePressed,
            ]}
          >
            <Text
              style={[
                styles.choiceLabel,
                selected && styles.choiceLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <OnboardingScreenLayout
      title="Do you agree with the statement below?"
      subtitle={`${currentIdx + 1} of ${total}`}
      progress={subProgress}
      onBack={handleBack}
      footer={choicesRow}
    >
      <Animated.View
        style={[
          styles.stage,
          { opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <View style={styles.card}>
          <LinearGradient
            colors={['#FFFFFF', '#FFFFFF', 'rgba(255,255,255,0)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Text style={styles.statement}>“{statement.text}”</Text>
          {statement.image ? (
            <View style={styles.arch}>
              <Image
                source={statement.image}
                style={styles.illustration}
                resizeMode="cover"
                accessible={false}
              />
            </View>
          ) : null}
        </View>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 28,
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
    overflow: 'hidden',
  },
  statement: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  arch: {
    width: '100%',
    aspectRatio: 0.78,
    maxHeight: 380,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 4,
    borderColor: colors.primary.blue100,
    overflow: 'hidden',
    backgroundColor: colors.background.accentSoft,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  choices: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  choice: {
    minWidth: 112,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePressed: {
    backgroundColor: colors.background.secondary,
  },
  choiceSelected: {
    borderWidth: 0,
    backgroundColor: colors.primary.blue600,
  },
  choiceLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 15,
    color: colors.text.primary,
  },
  choiceLabelSelected: {
    color: colors.text.inverse,
  },
});
