import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import type { PersonalizedIntentOption } from '../types';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const STAGGER_MS = 200;
const CARD_ENTER_DURATION = 420;
const INITIAL_DELAY = 320;

interface IntentReflectionScreenProps {
  option: PersonalizedIntentOption;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function IntentReflectionScreen({
  option,
  stepIndex,
  stepCount,
  isSubmitting,
  onContinue,
  onBack,
  onSkip,
}: IntentReflectionScreenProps) {
  const cardAnims = useRef(
    option.valuePoints.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(28),
    })),
  ).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    Animated.sequence([
      Animated.delay(INITIAL_DELAY),
      Animated.stagger(
        STAGGER_MS,
        cardAnims.map(({ opacity, translateX }) =>
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: CARD_ENTER_DURATION,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: CARD_ENTER_DURATION + 40,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    ]).start();
  }, []);

  return (
    <OnboardingScreenLayout
      title={option.hook}
      subtitle={option.reflectionBody}
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="I'm ready"
          onPress={onContinue}
          loading={isSubmitting}
        />
      }
    >
      <View style={styles.cards}>
        {option.valuePoints.map((point, index) => {
          const anim = cardAnims[index];
          if (!anim) return null;
          return (
            <Animated.View
              key={`${point.icon}-${index}`}
              style={[
                styles.card,
                {
                  opacity: anim.opacity,
                  transform: [{ translateX: anim.translateX }],
                },
              ]}
            >
              <View style={[styles.accentBar, { backgroundColor: point.accent }]} />
              <View style={styles.cardInner}>
                <View style={styles.iconWrap}>
                  <Icon name={point.icon} size={20} color={point.accent} />
                </View>
                <Text style={styles.cardLabel}>{point.label}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  accentBar: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
});
