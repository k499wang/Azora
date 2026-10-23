import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { MagicPlanScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import ChunkyButton, { CHUNKY_TONE_QUIET, CHUNKY_TONE_VIOLET } from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import ScreenContent from '../../components/common/ScreenContent';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { trackAzoAssistRequested } from '../../services/analytics/tracking';
import { AzoAssistAccessError, planDayWithAzo } from '../../services/azoAssist/azoAssistService';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import AzoPortrait from '../mascot/AzoPortrait';
import type { SuggestedTodo } from './domain/suggestedTodo';
import FreeMessagesCaption from './FreeMessagesCaption';
import SuggestedTodoRow from './SuggestedTodoRow';
import { useAzoAssist } from './useAzoAssist';
import { useVoiceNote } from './useVoiceNote';
import VoiceNoteButton from './VoiceNoteButton';

const MAX_BRAIN_DUMP_LENGTH = 1000;

type Stage = 'write' | 'review';

/**
 * Tiimo-style co-planning: everything on their mind, typed or said, comes back
 * as a few small to-dos for today. Nothing is saved until they keep it.
 */
export default function MagicPlanScreen({ navigation }: MagicPlanScreenProps) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const assist = useAzoAssist('sparkle');
  const [stage, setStage] = useState<Stage>('write');
  const [planning, setPlanning] = useState(false);
  const [brainDump, setBrainDump] = useState('');
  const [todos, setTodos] = useState<SuggestedTodo[]>([]);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const appendSpoken = useCallback((text: string) => {
    setBrainDump((current) => `${current.trim()} ${text}`.trim().slice(0, MAX_BRAIN_DUMP_LENGTH));
  }, []);
  const voice = useVoiceNote({ onText: appendSpoken });

  const makePlan = async () => {
    if (!assist.access.allowed) {
      assist.openPaywall();
      return;
    }
    setPlanning(true);
    setError(null);
    try {
      const { todos: nextTodos, freeMessagesLeft } = await planDayWithAzo({
        brainDump,
        todos: assist.todayTitles,
      });
      trackAzoAssistRequested({ surface: 'sparkle', outcome: 'answered' });
      assist.recordFreeMessagesLeft(freeMessagesLeft);
      setTodos(nextTodos);
      setKept(new Set(nextTodos.map((_, index) => index)));
      setStage('review');
    } catch (nextError) {
      trackAzoAssistRequested({ surface: 'sparkle', outcome: 'failed' });
      if (nextError instanceof AzoAssistAccessError) {
        assist.refreshFreeMessages();
        assist.openPaywall();
        return;
      }
      setError(nextError instanceof Error ? nextError.message : 'Azo couldn’t answer right now. Try again.');
    } finally {
      setPlanning(false);
    }
  };

  const toggle = (index: number) => {
    setKept((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const keptTodos = todos.filter((_, index) => kept.has(index));
  const outOfFree = assist.freeMessagesLeft === 0;
  const upgrade = () => assist.openPaywall('upsell');
  const canPlan = brainDump.trim().length > 0 && voice.phase === 'idle' && !assist.access.isLoading;

  return (
    <View style={styles.screen}>
      <AppTopBar
        title="Plan with Azo"
        rightSlot={<CloseButton accessibilityLabel="Close" onPress={() => navigation.goBack()} />}
        showAvatar={false}
        showStreak={false}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenContent width="grouped" style={styles.content}>
            {stage === 'write' ? (
              <>
                <View style={styles.intro}>
                  <AzoPortrait size={120} expression="listening" active={focused} />
                  <Text style={styles.heading}>What’s on your mind today?</Text>
                  <Text style={styles.subheading}>
                    Dump it all here, messy is fine. Type it or just say it, and I’ll turn it into a few small steps.
                  </Text>
                </View>
                <View style={[card.base, card.shadow, styles.inputCard]}>
                  <TextInput
                    multiline
                    value={brainDump}
                    onChangeText={setBrainDump}
                    editable={!planning}
                    maxLength={MAX_BRAIN_DUMP_LENGTH}
                    placeholder="Laundry, reply to Sam, I keep putting off the dentist…"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.input}
                    accessibilityLabel="Everything on your mind"
                  />
                  <View style={styles.inputFooter}>
                    <Text style={styles.voiceHint} accessibilityLiveRegion="polite">
                      {voice.phase === 'recording'
                        ? `Listening… ${Math.floor(voice.durationMillis / 1000)}s · tap to stop`
                        : voice.phase === 'transcribing'
                          ? 'Writing it down…'
                          : 'Rather talk? Tap the mic'}
                    </Text>
                    <VoiceNoteButton
                      phase={voice.phase}
                      metering={voice.metering}
                      onPress={() => {
                        if (outOfFree) assist.openPaywall();
                        else if (!planning) voice.toggle();
                      }}
                    />
                  </View>
                </View>
                {voice.error != null ? <Text accessibilityRole="alert" style={styles.error}>{voice.error}</Text> : null}
                {error != null ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              </>
            ) : null}

            {stage === 'review' ? (
              <>
                <View style={styles.reviewHeader}>
                  <Text style={styles.heading}>Here’s a calmer today</Text>
                  <Text style={styles.subheading}>Keep what helps. Untick anything that doesn’t belong today.</Text>
                </View>
                <View style={styles.list}>
                  {todos.map((todo, index) => (
                    <SuggestedTodoRow
                      key={`${index}:${todo.title}`}
                      todo={todo}
                      selected={kept.has(index)}
                      disabled={assist.adding}
                      onToggle={() => toggle(index)}
                    />
                  ))}
                </View>
                {assist.addError != null ? (
                  <Text accessibilityRole="alert" style={styles.error}>Couldn’t add those. Try again.</Text>
                ) : null}
              </>
            ) : null}
          </ScreenContent>
        </ScrollView>
        <View style={[styles.tray, { paddingBottom: insets.bottom + spacing.md }]}>
          <ScreenContent width="grouped" style={styles.trayContent}>
            {assist.freeMessagesLeft != null ? (
              <FreeMessagesCaption left={assist.freeMessagesLeft} onUpgrade={upgrade} />
            ) : null}
            {stage === 'write' ? (
              <ChunkyButton
                shape="card"
                label="Make my plan"
                tone={CHUNKY_TONE_VIOLET}
                disabled={!canPlan}
                loading={planning}
                onPress={() => { void makePlan(); }}
                icon={<Icon name="ai-sparkles" size={22} color={colors.text.inverse} />}
              />
            ) : (
              <>
                <ChunkyButton
                  shape="card"
                  label={keptTodos.length === 1 ? 'Add 1 to today' : `Add ${keptTodos.length} to today`}
                  disabled={keptTodos.length === 0}
                  loading={assist.adding}
                  onPress={() => assist.addTodos(keptTodos, () => navigation.goBack())}
                />
                <ChunkyButton
                  shape="card"
                  label="Start over"
                  tone={CHUNKY_TONE_QUIET}
                  disabled={assist.adding}
                  onPress={() => setStage('write')}
                />
              </>
            )}
          </ScreenContent>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: { alignItems: 'center', gap: spacing.sm },
  heading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subheading: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  inputCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
  },
  input: {
    ...typography.body.large,
    lineHeight: wrappedLineHeight(typography.body.large.fontSize),
    fontFamily: fonts.medium,
    color: colors.text.primary,
    minHeight: 140,
    padding: 0,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  voiceHint: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
    flexShrink: 1,
  },
  reviewHeader: { gap: spacing.xs },
  list: { gap: spacing.sm },
  error: { ...typography.body.small, color: colors.error[700], textAlign: 'center' },
  tray: {
    ...card.trayShadow,
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
  },
  trayContent: { gap: spacing.sm },
});
