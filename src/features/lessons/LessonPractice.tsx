import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ChunkyButton, { CHUNKY_TONE_SOFT } from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { triggerSoftHaptic } from '../../native/tapHaptics';
import { ChoiceRow, FeedbackLine } from './LessonBlockView';
import type { Lesson } from './domain/lessonCatalogue';
import type { LearningPracticeRecord } from './domain/learningPractice';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const BUTTON_ICON_SIZE = 20;
const ILLUSTRATION_SIZE = 36;
const EYEBROW_SIZE = 13;
const EYEBROW_LINE_HEIGHT = 16;
const ROW_TITLE_SIZE = 18;
const ROW_TITLE_LINE_HEIGHT = 25;

type Illustration = ComponentProps<typeof TaskIllustration>['name'];
type Response = LearningPracticeRecord['response'];

const RESPONSES: readonly (readonly [Response, string])[] = [
  ['tried', 'I tried it'],
  ['adapted', 'I changed it to fit'],
  ['later', 'Not yet'],
  ['tooHard', 'It felt too big'],
  ['unclear', 'Show me how'],
];

function TakeawayRow({ icon, title, text, last = false }: { icon: Illustration; title: string; text: string; last?: boolean }) {
  return <View style={[styles.row, !last && styles.rowDivided]}>
    <View style={card.taskIcon}><TaskIllustration name={icon} size={ILLUSTRATION_SIZE} /></View>
    <View style={styles.rowCopy}>
      <Text accessibilityRole="header" style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowBody}>{text.replace(/\*\*/g, '')}</Text>
    </View>
  </View>;
}

export function LessonRecap({ lesson, context, onAdd, adding, added, error }: {
  lesson: Lesson; context: string; onAdd?: () => void; adding: boolean; added: boolean; error: boolean;
}) {
  return <View style={styles.block}>
    <Text accessibilityRole="header" style={styles.eyebrow}>Take this with you</Text>
    <View style={[card.base, card.shadow, styles.card]}>
      <TakeawayRow icon="lightbulb" title="Remember this" text={lesson.introduction} />
      <TakeawayRow icon="clock" title="Use it when" text={context} />
      <TakeawayRow icon="calendar-check-outline" title="Try today" text={lesson.step} last />
    </View>
    {onAdd != null ? <ChunkyButton
      shape="card"
      tone={CHUNKY_TONE_SOFT}
      haptic="tap"
      label={added ? 'Added to My To-dos' : adding ? 'Adding…' : 'Add to My To-dos'}
      disabled={adding || added}
      onPress={onAdd}
      icon={<Icon bold name={added ? 'check' : 'plus'} size={BUTTON_ICON_SIZE} color={CHUNKY_TONE_SOFT.label} />}
    /> : null}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.status}>Your to-do could not be saved. Tap again to retry.</Text> : null}
  </View>;
}

export function LessonFollowUp({ lesson, record, onSave, saving, preview = false }: {
  lesson: Lesson; record?: LearningPracticeRecord;
  onSave: (response: Response, helpful: boolean | null) => Promise<void>;
  saving: boolean;
  preview?: boolean;
}) {
  const [response, setResponse] = useState(record?.response ?? null);
  const [helpful, setHelpful] = useState(record?.helpful ?? null);
  const [failed, setFailed] = useState(false);
  const save = (next: Response, useful: boolean | null) => {
    if (saving) return;
    setResponse(next); setHelpful(useful); setFailed(false);
    void onSave(next, useful).catch(() => setFailed(true));
  };
  const pick = (next: Response, useful: boolean | null) => {
    if (saving) return;
    triggerSoftHaptic();
    save(next, useful);
  };
  const explanation = lesson.blocks.find((block) => block.kind === 'sequence' || block.kind === 'reveal' || block.kind === 'choice');
  const guidance = explanation?.kind === 'sequence' ? explanation.steps.join('\n')
    : explanation?.kind === 'reveal' ? explanation.items.map((item) => `${item.label}: ${item.detail}`).join('\n\n')
      : explanation?.kind === 'choice' ? explanation.options.map((option) => `${option.label}: ${option.feedback}`).join('\n\n')
        : lesson.introduction;
  return <View style={styles.block}>
    <Text accessibilityRole="header" style={styles.eyebrow}>A quick look back</Text>
    <View style={[card.base, card.shadow, styles.card]}>
      <TakeawayRow icon="calendar-check-outline" title={`From “${lesson.title}”`} text={lesson.step} last />
    </View>
    <Text style={styles.prompt}>Did you try it?</Text>
    <View style={styles.choices}>{RESPONSES.map(([value, label]) => <ChoiceRow
      key={value}
      label={label}
      state={response === value ? 'picked' : 'idle'}
      onPress={() => pick(value, null)}
    />)}</View>
    {response === 'tried' || response === 'adapted' ? <>
      <Text style={styles.prompt}>Was it useful?</Text>
      <View style={styles.choices}>{[true, false].map((value) => <ChoiceRow
        key={String(value)}
        label={value ? 'Yes' : 'Not this time'}
        state={helpful === value ? 'picked' : 'idle'}
        onPress={() => pick(response, value)}
      />)}</View>
    </> : null}
    {response === 'tooHard' ? <FeedbackLine text={`**Make the first attempt smaller.** Choose just the first part of the step. Try it once, then stop and decide whether to continue.`} /> : null}
    {response === 'unclear' && guidance ? <FeedbackLine text={`**Walk through this example.**\n${guidance}`} /> : null}
    {response === 'later' ? <FeedbackLine text="That’s okay. You can come back to it when you’re ready." /> : null}
    {failed ? <Pressable accessibilityRole="button" onPress={() => response != null && save(response, helpful)}>
      <Text style={styles.retry}>Couldn’t save your answer. Tap to retry.</Text>
    </Pressable> : response != null && !saving ? <Text accessibilityLiveRegion="polite" style={styles.status}>{preview ? 'Preview only — nothing is saved.' : 'Saved'}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  eyebrow: { ...typography.overline, fontFamily: fonts.semibold, fontSize: EYEBROW_SIZE, lineHeight: EYEBROW_LINE_HEIGHT, color: colors.primary.blue500 },
  card: { borderRadius: radius.xl, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  rowDivided: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle },
  rowCopy: { flex: 1, gap: spacing['2xs'] },
  rowTitle: { fontSize: ROW_TITLE_SIZE, lineHeight: ROW_TITLE_LINE_HEIGHT, fontFamily: fonts.semibold, color: colors.text.primary },
  rowBody: { ...typography.body.medium, color: colors.text.secondary },
  prompt: { fontSize: ROW_TITLE_SIZE, lineHeight: ROW_TITLE_LINE_HEIGHT, fontFamily: fonts.semibold, color: colors.text.primary },
  choices: { gap: spacing.sm },
  status: { ...typography.body.small, color: colors.text.tertiary },
  retry: { ...typography.body.small, fontFamily: fonts.semibold, color: colors.primary.blue500 },
});
