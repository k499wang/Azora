import { useEffect, useRef, useState } from 'react';
import { Keyboard, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { CoachingSurveyScreenProps } from '../app/navigation';
import { Text, TextInput } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import TaskIllustration from '../components/common/icons/TaskIllustration';
import AzoAside from '../components/onboarding/AzoAside';
import OnboardingHapticSlider from '../components/onboarding/OnboardingHapticSlider';
import OnboardingOptionList, {
  type OnboardingOption,
} from '../components/onboarding/OnboardingOptionList';
import OnboardingPrimaryButton from '../components/onboarding/OnboardingPrimaryButton';
import OnboardingScreenLayout from '../components/onboarding/OnboardingScreenLayout';
import OnboardingSurface from '../components/onboarding/OnboardingSurface';
import { entranceTiming } from '../components/onboarding/entranceTiming';
import {
  isCoachingSurveyComplete,
  type ComfortablePaying,
} from '../features/coaching/domain/coachingSurvey';
import { setCoachingOfferForced } from '../features/coaching/useCoachingOffer';
import type { AzoExpression } from '../features/mascot/azoFace';
import { triggerTapHaptic } from '../native/tapHaptics';
import { saveCoachingSurvey } from '../services/coaching/coachingSurveyService';
import { saveCoachingOfferDismissed } from '../services/preferences/coachingOfferPreference';
import { useAuthStore } from '../stores/authStore';
import { card, radius, softColoredCard } from '../theme/card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const COACHING_CALENDLY_URL = 'https://calendly.com/kevin-tryazora';

const OPTION_ACCENT = colors.primary.blue500;
const PAYING_OPTIONS: OnboardingOption<ComfortablePaying>[] = [
  { id: 'yes', title: 'Yes', accent: OPTION_ACCENT },
  { id: 'maybe', title: 'Maybe', accent: OPTION_ACCENT },
  { id: 'no', title: 'No', accent: OPTION_ACCENT },
];

const QUESTIONS: { text: string; note?: string; expression: AzoExpression }[] = [
  {
    text: 'What would you most like help with right now?',
    note: 'Your coach will read this before your call.',
    expression: 'happy',
  },
  {
    text: 'What would you like to be different in 30 days?',
    expression: 'curious',
  },
  {
    text: 'What have you tried, and what keeps getting in the way?',
    expression: 'listening',
  },
  {
    text: 'How important is making this change right now?',
    expression: 'thinking',
  },
  {
    text: 'If it feels like a fit, would $79/month work for you?',
    note: 'You are free to pay whatever amount you want. $79 helps us pay our coaches.',
    expression: 'listening',
  },
  {
    text: 'Last thing. Where can your coach reach you?',
    expression: 'happy',
  },
];
const CALL_TOPICS = [
  { icon: 'todo-message', text: 'Talk it through' },
  { icon: 'heart', text: 'See if it fits' },
  { icon: 'lightbulb', text: 'Ask anything' },
] as const;
const IMPORTANCE_STEP = 3;
const DETAILS_STEP = QUESTIONS.length - 1;
const BOOKING_STEP = QUESTIONS.length;

interface DetailFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  keyboardType?: 'email-address';
  onFocus: (field: View) => void;
}

function DetailField({
  label,
  value,
  onChangeText,
  editable,
  keyboardType,
  onFocus,
}: DetailFieldProps) {
  const field = useRef<View>(null);

  return (
    <View ref={field} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType == null ? 'words' : 'none'}
        autoCorrect={false}
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onFocus={() => {
          if (field.current != null) onFocus(field.current);
        }}
        style={[styles.input, styles.inputSingleLine]}
        value={value}
      />
    </View>
  );
}

export default function CoachingSurveyScreen({ navigation, route }: CoachingSurveyScreenProps) {
  const preview = __DEV__ && route.params?.preview === true;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [step, setStep] = useState(0);
  const [helpWith, setHelpWith] = useState('');
  const [differentIn30Days, setDifferentIn30Days] = useState('');
  const [triedAndObstacles, setTriedAndObstacles] = useState('');
  const [importance, setImportance] = useState(5);
  const [comfortablePaying, setComfortablePaying] = useState<ComfortablePaying | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreedToShare, setAgreedToShare] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const focusedField = useRef<View | null>(null);

  // Runs again once the keyboard is up: until then the page may have no room to
  // scroll, and the move would be clamped away.
  const scrollToFocusedField = () => {
    // Present at runtime; React Native's published types leave it out.
    const inner = (scroll.current as unknown as { getInnerViewRef(): View | null } | null)?.getInnerViewRef();
    if (inner == null) return;
    focusedField.current?.measureLayout(inner, (_x, y) => {
      scroll.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });
    });
  };

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', scrollToFocusedField);
    return () => shown.remove();
  }, []);

  const focusField = (field: View) => {
    focusedField.current = field;
    scrollToFocusedField();
  };

  const answers = {
    helpWith,
    differentIn30Days,
    triedAndObstacles,
    importance,
    comfortablePaying,
    name,
    email,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    agreedToShare,
  };

  const next = () => setStep((current) => current + 1);
  const back = () => (step === 0 ? navigation.goBack() : setStep(step - 1));

  const send = async () => {
    if (preview) {
      next();
      return;
    }
    if (userId == null || comfortablePaying == null) return;
    setSending(true);
    setError(null);
    try {
      await saveCoachingSurvey(userId, { ...answers, importance, comfortablePaying });
      setCoachingOfferForced(false);
      await saveCoachingOfferDismissed(userId);
      next();
    } catch {
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (step === BOOKING_STEP) {
    return (
      <OnboardingSurface>
        <OnboardingScreenLayout
          key="booking"
          title=""
          titleSlot={
            <AzoAside
              text="Let's find a time to talk."
              variant="question"
              expression="happy"
              wearing="glasses"
              holding="notes"
              delayMs={entranceTiming.promptDelay}
            />
          }
          footer={
            <View style={styles.bookingActions}>
              <OnboardingPrimaryButton
                label="Book a free call"
                onPress={() => void Linking.openURL(COACHING_CALENDLY_URL)}
              />
              <Pressable
                accessibilityRole="button"
                hitSlop={spacing.sm}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
          }
        >
          <View style={styles.bookingCards}>
            <View style={styles.priceCard}>
              <TaskIllustration name="coin" size={spacing['4xl']} />
              <Text style={styles.priceTitle}>Nothing to pay today</Text>
              <Text style={styles.priceBody}>
                Coaching includes a personalized plan, weekly written support, and a monthly call.
                Booking this call does not enroll or charge you.
              </Text>
            </View>
            <View style={styles.callCard}>
              <TaskIllustration name="calendar-check-outline" size={spacing['5xl']} />
              <Text style={styles.callTitle}>Free 15-minute call</Text>
              <Text style={styles.callMeta}>Just you and your coach.</Text>
              <View style={styles.callTopics}>
                {CALL_TOPICS.map((topic) => (
                  <View key={topic.text} style={styles.callTopic}>
                    <TaskIllustration name={topic.icon} size={spacing['2xl']} />
                    <Text style={styles.callTopicText}>{topic.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </OnboardingScreenLayout>
      </OnboardingSurface>
    );
  }

  const textSteps = [
    { value: helpWith, onChange: setHelpWith },
    { value: differentIn30Days, onChange: setDifferentIn30Days },
    { value: triedAndObstacles, onChange: setTriedAndObstacles },
  ];
  const textStep = textSteps[step];
  const canContinue =
    preview ||
    step === IMPORTANCE_STEP ||
    (step === DETAILS_STEP
      ? isCoachingSurveyComplete(answers)
      : textStep != null && textStep.value.trim().length > 0);
  const hasFooter = step !== 4;

  return (
    <OnboardingSurface>
      <OnboardingScreenLayout
        key={step}
        title=""
        titleSlot={
          <AzoAside
            text={QUESTIONS[step].text}
            note={QUESTIONS[step].note}
            variant="question"
            expression={QUESTIONS[step].expression}
            wearing="glasses"
            holding="notes"
            delayMs={entranceTiming.promptDelay}
          />
        }
        progress={step / QUESTIONS.length}
        onBack={back}
        keyboardAvoiding={textStep != null || step === DETAILS_STEP}
        scrollRef={step === DETAILS_STEP ? scroll : undefined}
        centerBody={step === IMPORTANCE_STEP}
        footer={
          hasFooter ? (
            <OnboardingPrimaryButton
              label={step === DETAILS_STEP ? 'Submit' : 'Continue'}
              onPress={step === DETAILS_STEP ? () => void send() : next}
              disabled={!canContinue}
              loading={sending}
            />
          ) : undefined
        }
      >
        {textStep != null ? (
          <TextInput
            accessibilityLabel={QUESTIONS[step].text}
            autoCapitalize="sentences"
            autoCorrect
            multiline
            onChangeText={textStep.onChange}
            style={[styles.input, styles.inputMultiline]}
            textAlignVertical="top"
            value={textStep.value}
          />
        ) : null}
        {step === IMPORTANCE_STEP ? (
          <OnboardingHapticSlider
            min={1}
            max={9}
            value={importance}
            accent={OPTION_ACCENT}
            onChange={setImportance}
            minLabel="It can wait."
            maxLabel="It matters a lot right now."
          />
        ) : null}
        {step === 4 ? (
          <OnboardingOptionList
            options={PAYING_OPTIONS}
            selectedIds={comfortablePaying == null ? [] : [comfortablePaying]}
            onSelect={setComfortablePaying}
            onAdvance={next}
          />
        ) : null}
        {step === DETAILS_STEP ? (
          <View style={styles.details}>
            <DetailField
              label="Name"
              value={name}
              onChangeText={setName}
              editable={!sending}
              onFocus={focusField}
            />
            <DetailField
              label="Email"
              value={email}
              onChangeText={setEmail}
              editable={!sending}
              onFocus={focusField}
              keyboardType="email-address"
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedToShare }}
              disabled={sending}
              onPress={() => {
                triggerTapHaptic();
                setAgreedToShare((agreed) => !agreed);
              }}
              style={styles.agreement}
            >
              <View style={[styles.checkbox, agreedToShare && styles.checkboxChecked]}>
                {agreedToShare ? (
                  <Icon name="check" size={16} color={colors.text.inverse} />
                ) : null}
              </View>
              <Text style={styles.agreementText}>
                I agree that my answers will be shared with the coach. Coaching is not therapy or
                emergency support.
              </Text>
            </Pressable>
            {error != null ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}
      </OnboardingScreenLayout>
    </OnboardingSurface>
  );
}

const styles = StyleSheet.create({
  bookingCards: {
    gap: spacing.md,
  },
  callCard: {
    ...card.base,
    ...card.outlined,
    alignItems: 'center',
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  callTitle: {
    ...typography.title.title3,
    marginTop: spacing.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
  callMeta: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  callTopics: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.mdPlus,
  },
  callTopic: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  callTopicText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  priceCard: {
    ...softColoredCard({ tint: colors.playful.amber.soft }),
    alignItems: 'center',
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.mdPlus,
    paddingVertical: spacing.lg,
  },
  priceTitle: {
    ...typography.title.title2,
    marginTop: spacing.xs,
    color: colors.playful.amber.ink,
    textAlign: 'center',
  },
  priceBody: {
    ...typography.body.large,
    marginTop: spacing.xs,
    color: colors.playful.amber.ink,
    textAlign: 'center',
  },
  bookingActions: {
    alignItems: 'stretch',
    gap: spacing.md,
  },
  done: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  details: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    ...typography.input.text,
    color: colors.text.primary,
  },
  // iOS draws a single-line field's text high when it has a line height.
  inputSingleLine: {
    height: spacing['4xl'],
    paddingVertical: 0,
    lineHeight: undefined,
  },
  inputMultiline: {
    minHeight: 156,
  },
  agreement: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkbox: {
    width: spacing.lg,
    height: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.primary.blue300,
    backgroundColor: colors.background.card,
  },
  checkboxChecked: {
    borderColor: colors.primary.blue500,
    backgroundColor: colors.primary.blue500,
  },
  agreementText: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.secondary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
