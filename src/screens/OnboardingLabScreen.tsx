/** Preview single onboarding screens without walking the whole flow. */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingLabScreenProps } from '../app/navigation';
import GlassIconButton from '../components/common/GlassIconButton';
import { Text } from '../components/common/Text';
import OnboardingSurface from '../components/onboarding/OnboardingSurface';
import GoalProofScreen from '../components/onboarding/screens/GoalProofScreen';
import HabitCurveScreen from '../components/onboarding/screens/HabitCurveScreen';
import HeartVariabilityScreen from '../components/onboarding/screens/HeartVariabilityScreen';
import PersonalizeIntroScreen from '../components/onboarding/screens/PersonalizeIntroScreen';
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
  { id: 'personalizeIntro', title: 'Personalized plan intro', render: (props) => <PersonalizeIntroScreen {...props} /> },
  { id: 'heartVariability', title: 'Heart-rate chart', render: (props) => <HeartVariabilityScreen {...props} /> },
  { id: 'habitCurve', title: 'Habit curve chart', render: (props) => <HabitCurveScreen {...props} /> },
  { id: 'goalProof', title: 'Goals 2× faster bars', render: (props) => <GoalProofScreen {...props} /> },
];

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
