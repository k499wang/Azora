import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '../common/Text';
import ChunkyButton, { CHUNKY_TONE_SOFT } from '../common/ChunkyButton';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

export interface InterruptPromptOption {
  id: string;
  label: string;
}

interface InterruptPromptProps {
  visible: boolean;
  question: string;
  /** One line under the question, saying what the answer changes. */
  note?: string;
  options: readonly InterruptPromptOption[];
  onAnswer: (id: string) => void;
}

/** The same shallow lip the loading card and the option rows sit on. */
const LIP_DEPTH = 3;
const SCRIM_DURATION_MS = 220;

/**
 * A question that arrives on top of whatever is running behind it: the page
 * greys out and a card takes the centre, so the interruption reads as the work
 * stopping to ask rather than as the next screen.
 */
export default function InterruptPrompt({
  visible,
  question,
  note,
  options,
  onAnswer,
}: InterruptPromptProps) {
  const [mounted, setMounted] = useState(visible);
  const scrim = useRef(new Animated.Value(0)).current;
  const cardEnter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      Animated.parallel([
        Animated.timing(scrim, {
          toValue: 1,
          duration: SCRIM_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(cardEnter, {
          toValue: 1,
          damping: 14,
          stiffness: 200,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(scrim, {
        toValue: 0,
        duration: SCRIM_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardEnter, {
        toValue: 0,
        duration: SCRIM_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, scrim, cardEnter]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.scrim, { opacity: scrim }]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityViewIsModal
    >
      <Animated.View
        style={[
          card.base,
          styles.card,
          {
            opacity: cardEnter,
            transform: [
              {
                scale: cardEnter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.question}>{question}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <View style={styles.actions}>
          {options.map((option, index) => (
            <ChunkyButton
              key={option.id}
              label={option.label}
              tone={index === 0 ? undefined : CHUNKY_TONE_SOFT}
              onPress={() => onAnswer(option.id)}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background.card,
    padding: spacing.xl,
    paddingBottom: spacing.xl - LIP_DEPTH,
    borderBottomWidth: LIP_DEPTH,
    borderBottomColor: colors.neutral[200],
    gap: spacing.sm,
  },
  question: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
