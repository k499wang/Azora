import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalmKoala from '../../assets/Poses/koala_pose_calm.svg';
import type { ProFeedbackScreenProps } from '../app/navigation';
import ChunkyButton, {
  CHUNKY_TONE_QUIET,
  CHUNKY_TONE_SOFT,
} from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import { Rise } from '../components/common/Reveal';
import ScreenContent from '../components/common/ScreenContent';
import { Text, TextInput } from '../components/common/Text';
import { radius } from '../theme/card';
import { colors } from '../theme/colors';
import { duration, easing } from '../theme/motion';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { useAuthStore } from '../stores/authStore';
import {
  saveAppFeedback,
  type Disappointment,
} from '../services/feedback/appFeedbackService';

const CHOICES: { value: Disappointment; label: string }[] = [
  { value: 'very', label: 'Very disappointed' },
  { value: 'somewhat', label: 'Somewhat disappointed' },
  { value: 'not', label: 'Not disappointed' },
];

const KOALA_WIDTH = 160;
const KOALA_ASPECT = 1200 / 1080;
const HALO_SIZE = 240;
/** one slow in-or-out, about the length of a calm breath */
const BREATH_MS = 3_200;
const BREATH_SCALE = 0.08;

function ThankYou() {
  const reducedMotion = useReducedMotion();
  const enter = useSharedValue(reducedMotion ? 1 : 0);
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    enter.value = withTiming(1, { duration: duration.slower, easing: easing.settle });
    breath.value = withDelay(
      duration.slower,
      withRepeat(withTiming(1, { duration: BREATH_MS, easing: easing.breathe }), -1, true),
    );
  }, [reducedMotion, enter, breath]);

  const outerHalo = useAnimatedStyle(() => ({
    opacity: enter.value * 0.6,
    transform: [{ scale: (0.85 + 0.15 * enter.value) * (1 + BREATH_SCALE * breath.value) }],
  }));
  const innerHalo = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: (0.85 + 0.15 * enter.value) * (1 + BREATH_SCALE * 0.5 * breath.value) }],
  }));
  const koala = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 12 + breath.value * -3 }],
  }));

  return (
    <View style={styles.thanks}>
      <View style={styles.art}>
        <Animated.View style={[styles.halo, styles.outerHalo, outerHalo]} />
        <Animated.View style={[styles.halo, styles.innerHalo, innerHalo]} />
        <Animated.View style={koala}>
          <CalmKoala width={KOALA_WIDTH} height={KOALA_WIDTH * KOALA_ASPECT} />
        </Animated.View>
      </View>
      <Rise delay={reducedMotion ? 0 : duration.base}>
        <Text style={styles.thanksTitle}>Thank you</Text>
      </Rise>
      <Rise delay={reducedMotion ? 0 : duration.slow}>
        <Text style={styles.thanksBody}>
          We read every answer.{'\n'}It shapes what we build next.
        </Text>
      </Rise>
    </View>
  );
}

export default function ProFeedbackScreen({ navigation }: ProFeedbackScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [disappointment, setDisappointment] = useState<Disappointment | null>(null);
  const [improvement, setImprovement] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (userId == null || disappointment == null) return;
    setSending(true);
    setError(null);
    try {
      await saveAppFeedback(userId, disappointment, improvement);
      setSent(true);
    } catch {
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>
      {sent ? (
        <ThankYou />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenContent>
            <View style={styles.section}>
              <Text style={styles.title}>
                How would you feel if you could no longer use Azora?
              </Text>
              <View style={styles.choices} accessibilityRole="radiogroup">
                {CHOICES.map((choice) => (
                  <ChunkyButton
                    key={choice.value}
                    label={choice.label}
                    shape="card"
                    accessibilityRole="radio"
                    selected={disappointment === choice.value}
                    tone={
                      disappointment === choice.value ? CHUNKY_TONE_SOFT : CHUNKY_TONE_QUIET
                    }
                    haptic="tap"
                    onPress={() => setDisappointment(choice.value)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.question}>What's one thing we should improve?</Text>
              <TextInput
                accessibilityLabel="What's one thing we should improve"
                autoCapitalize="sentences"
                editable={!sending}
                multiline
                onChangeText={setImprovement}
                placeholder="Optional"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                textAlignVertical="top"
                value={improvement}
              />
            </View>
            {error != null ? <Text style={styles.error}>{error}</Text> : null}
          </ScreenContent>
        </ScrollView>
      )}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <ScreenContent>
          {sent ? (
            <ChunkyButton label="Done" onPress={() => navigation.goBack()} />
          ) : (
            <ChunkyButton
              label="Send"
              onPress={() => void send()}
              disabled={disappointment == null}
              loading={sending}
            />
          )}
        </ScreenContent>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  thanks: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  art: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  halo: {
    position: 'absolute',
    borderRadius: HALO_SIZE / 2,
  },
  outerHalo: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    backgroundColor: colors.playful.sky.soft,
  },
  innerHalo: {
    width: HALO_SIZE * 0.72,
    height: HALO_SIZE * 0.72,
    backgroundColor: colors.playful.sky.tint,
  },
  thanksTitle: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  thanksBody: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  question: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  choices: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 120,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    ...typography.input.text,
    color: colors.text.primary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
