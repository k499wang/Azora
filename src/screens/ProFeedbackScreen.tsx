import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProFeedbackScreenProps } from '../app/navigation';
import ChunkyButton, {
  CHUNKY_TONE_QUIET,
  CHUNKY_TONE_SOFT,
} from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import { RiseUnlessReducedMotion } from '../components/common/Reveal';
import ScreenContent from '../components/common/ScreenContent';
import { Text, TextInput } from '../components/common/Text';
import { card, radius } from '../theme/card';
import { colors } from '../theme/colors';
import { duration } from '../theme/motion';
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

function FounderNote() {
  const reducedMotion = useReducedMotion();

  return (
    <View style={styles.thanks}>
      <RiseUnlessReducedMotion reducedMotion={reducedMotion} delay={duration.base} style={styles.note}>
        <Text style={styles.noteTitle}>Thanks for telling me.</Text>
        <Text style={styles.noteBody}>
          I'm Fia, and I build Azora. I read every one of these myself.
        </Text>
        <Text style={styles.noteBody}>
          If you'd like to talk it through, email me from Settings → Send feedback.
        </Text>
        <Text style={styles.signature}>Fia, founder</Text>
      </RiseUnlessReducedMotion>
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
  const scroll = useRef<ScrollView>(null);

  // Once the keyboard is up, bring the improvement box into view above it.
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      scroll.current?.scrollToEnd({ animated: true });
    });
    return () => shown.remove();
  }, []);

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
        <FounderNote />
      ) : (
        <ScrollView
          ref={scroll}
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  note: {
    ...card.base,
    ...card.shadow,
    gap: spacing.md,
    padding: spacing.xl,
  },
  noteTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  noteBody: {
    ...typography.body.large,
    color: colors.text.secondary,
  },
  signature: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    marginTop: spacing.sm,
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
