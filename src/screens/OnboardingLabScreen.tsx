/** Preview single onboarding screens without walking the whole flow. */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingLabScreenProps } from '../app/navigation';
import GlassIconButton from '../components/common/GlassIconButton';
import { Text } from '../components/common/Text';
import OnboardingSurface from '../components/onboarding/OnboardingSurface';
import AzoMessageScreen from '../components/onboarding/screens/AzoMessageScreen';
import AzoChatScreen from '../components/onboarding/screens/AzoChatScreen';
import ChalkboardScreen from '../components/onboarding/screens/ChalkboardScreen';
import GoalProofScreen from '../components/onboarding/screens/GoalProofScreen';
import HabitCurveScreen from '../components/onboarding/screens/HabitCurveScreen';
import HeartVariabilityScreen from '../components/onboarding/screens/HeartVariabilityScreen';
import PersonalizeIntroScreen from '../components/onboarding/screens/PersonalizeIntroScreen';
import PlanDaysScreen from '../components/onboarding/screens/PlanDaysScreen';
import PlanRevealScreen, { type PlanRevealPhase } from '../components/onboarding/screens/PlanRevealScreen';
import RecommendedHabitsScreen from '../components/onboarding/screens/RecommendedHabitsScreen';
import { enrolledOrGoalPreset } from '../lib/onboardingPreset';
import type { MindMapScore } from '../lib/onboardingScores';
import { projectScores } from '../lib/paywallPersonalization';
import { buildStarterPlan, type StarterPlanDecisions } from '../lib/onboardingStarterPlan';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

interface PreviewProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface PreviewEntry {
  id: string;
  title: string;
  render: (props: PreviewProps) => ReactNode;
}

const PREVIEWS: readonly PreviewEntry[] = [
  { id: 'azoOpening', title: 'Azo message + Life Reset chat', render: (props) => <AzoOpeningPreview {...props} /> },
  { id: 'personalizeIntro', title: 'Personalized plan intro', render: (props) => <PersonalizeIntroScreen {...props} /> },
  { id: 'heartVariability', title: 'Heart-rate chart', render: (props) => <HeartVariabilityScreen {...props} /> },
  { id: 'habitCurve', title: 'Habit curve chart', render: (props) => <HabitCurveScreen {...props} /> },
  { id: 'cbtIntro', title: 'CBT chalkboard', render: (props) => <ChalkboardScreen lesson="cbtIntro" {...props} /> },
  { id: 'routineBrain', title: 'Routine brain chalkboard', render: (props) => <ChalkboardScreen lesson="routineBrain" {...props} /> },
  { id: 'recommendedHabits', title: 'Habit swipe deck + cheer', render: (props) => <RecommendedHabitsPreview {...props} /> },
  { id: 'goalProof', title: 'Goals 2× faster bars', render: (props) => <GoalProofScreen {...props} /> },
  { id: 'planReveal', title: 'Azora profile report + plan', render: (props) => <PlanRevealPreview {...props} /> },
  {
    id: 'planDays',
    title: 'Plan days + recommended plan',
    render: ({ onSkip: _, ...props }) => (
      <PlanDaysScreen
        {...props}
        triedEcho={null}
        lessonSubject="quiet"
        intent="other"
        preset={enrolledOrGoalPreset('home', 'other')}
      />
    ),
  },
];

function AzoOpeningPreview({ onContinue }: PreviewProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  return chatOpen ? (
    <AzoChatScreen
      answers={answers}
      onAnswersChange={setAnswers}
      onContinue={onContinue}
      onBack={() => setChatOpen(false)}
    />
  ) : (
    <AzoMessageScreen onContinue={() => setChatOpen(true)} />
  );
}

const SAMPLE_SCORES: MindMapScore[] = [
  { axis: 'calm', label: 'Calm', value: 34 },
  { axis: 'recovery', label: 'Recovery', value: 52 },
  { axis: 'focus', label: 'Focus', value: 71 },
  { axis: 'mood', label: 'Mood', value: 45 },
  { axis: 'vitality', label: 'Vitality', value: 58 },
];

/** Continue walks profile → plan on one mounted screen, the way the flow does. */
function PlanRevealPreview({ onSkip: _, onContinue, onBack, ...props }: PreviewProps) {
  const [phase, setPhase] = useState<PlanRevealPhase>('diagnosis');

  return (
    <PlanRevealScreen
      {...props}
      phase={phase}
      planId="home"
      reportAnswers={{
        goalPhrase: 'make your home feel manageable',
        sleepEcho: 'your mind won’t switch off at night',
        energyEcho: 'your energy goes up and down',
        focusEcho: 'you get distracted sometimes',
        stressEcho: null,
        contextEcho: 'chores often feel overwhelming',
        routineEcho: 'you’re always catching up',
        obstacleEcho: 'the first step is unclear',
      }}
      scores={SAMPLE_SCORES}
      targetScores={projectScores(SAMPLE_SCORES)}
      superpower={SAMPLE_SCORES[2]}
      growthArea={SAMPLE_SCORES[0]}
      onContinue={() => (phase === 'diagnosis' ? setPhase('plan') : onContinue())}
      onBack={() => (phase === 'plan' ? setPhase('diagnosis') : onBack())}
    />
  );
}

/** the deck owns no state of its own, so the lab holds the choices the flow would */
function RecommendedHabitsPreview({ onSkip: _, ...props }: PreviewProps) {
  const items = useMemo(
    () =>
      buildStarterPlan({
        intent: null,
        wakeEase: null,
        sleepDuration: null,
        dayActivity: null,
        routineHappiness: null,
        mentalHealth: [],
        procrastinationAreas: [],
        procrastinationReasons: [],
      }),
    [],
  );
  const [decisions, setDecisions] = useState<StarterPlanDecisions>({});

  return (
    <RecommendedHabitsScreen
      {...props}
      items={items}
      decisions={decisions}
      onDecide={(id, decision) => setDecisions((current) => ({ ...current, [id]: decision }))}
      onRestart={() => setDecisions({})}
    />
  );
}

const STUB_STEP_INDEX = 10;
const STUB_STEP_COUNT = 45;

/** clears the onboarding header row (its 32pt slot plus spacing.md above and below) */
const HEADER_ROW_HEIGHT = spacing['5xl'];

export default function OnboardingLabScreen({ navigation }: OnboardingLabScreenProps) {
  const insets = useSafeAreaInsets();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [replayCount, setReplayCount] = useState(0);
  const isDev = __DEV__;
  if (!isDev) {
    return null;
  }

  const open = (index: number | null) => {
    setPreviewIndex(index);
    setReplayCount(0);
  };

  if (previewIndex != null) {
    const entry = PREVIEWS[previewIndex];
    const advance = () => open(previewIndex + 1 < PREVIEWS.length ? previewIndex + 1 : null);

    return (
      <OnboardingSurface>
        <View key={`${entry.id}-${replayCount}`} style={styles.preview}>
          {entry.render({
            stepIndex: STUB_STEP_INDEX,
            stepCount: STUB_STEP_COUNT,
            onContinue: advance,
            onBack: () => open(null),
            onSkip: advance,
          })}
        </View>
        <GlassIconButton
          accessibilityLabel="Replay"
          variant="regular"
          onPress={() => setReplayCount((count) => count + 1)}
          style={[styles.replay, { top: insets.top + HEADER_ROW_HEIGHT + spacing.sm }]}
        >
          <MaterialCommunityIcons name="replay" size={20} color={colors.text.primary} />
        </GlassIconButton>
      </OnboardingSurface>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Settings</Text>
        </Pressable>
        <Text style={styles.heading}>Onboarding preview</Text>
        <Text style={styles.caption}>Choose a screen to preview it on its own. Continue steps to the next one.</Text>
      </View>

      <FlatList
        data={PREVIEWS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => open(index)}
            style={styles.row}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.id}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  header: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.md, gap: spacing.xs },
  back: { ...typography.body.medium, color: colors.text.brand },
  heading: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  caption: { ...typography.body.small, color: colors.text.secondary },
  listContent: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 14, backgroundColor: colors.background.card, gap: spacing.md },
  rowCopy: { flex: 1, gap: spacing.xs },
  rowTitle: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  rowMeta: { ...typography.body.small, color: colors.text.secondary },
  chevron: { fontSize: 24, color: colors.text.secondary },
  preview: { flex: 1 },
  replay: { position: 'absolute', right: spacing.lg },
});
