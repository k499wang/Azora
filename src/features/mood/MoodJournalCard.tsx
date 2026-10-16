/**
 * The check-in's journal page: a prompt at the top of a notepad, and ruled
 * lines under it to answer on.
 *
 * The prompt can be swapped for another as often as the user likes; none of
 * them has to be answered.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { MOOD_NOTE_MAX_LENGTH } from './domain/moodCheckIn';
import type { MoodFeelingSetId } from './domain/moodFeelings';
import { card, radius, softColoredCard } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const RULE_HEIGHT = 32;
const MIN_RULES = 4;

const HUE_FOR_SET = {
  tense: colors.playful.violet,
  low: colors.playful.sky,
  mixed: colors.playful.amber,
  bright: colors.playful.coral,
  easy: colors.playful.teal,
} as const satisfies Record<MoodFeelingSetId, unknown>;

interface MoodJournalCardProps {
  prompts: readonly string[];
  feelingSet: MoodFeelingSetId | null;
  value: string;
  onChange: (value: string) => void;
}

export default function MoodJournalCard({
  prompts,
  feelingSet,
  value,
  onChange,
}: MoodJournalCardProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [ruleCount, setRuleCount] = useState(MIN_RULES);
  const hue = HUE_FOR_SET[feelingSet ?? 'easy'];
  const prompt = prompts[promptIndex % Math.max(prompts.length, 1)] ?? '';

  return (
    <View style={styles.sheet}>
      <View style={[styles.binding, softColoredCard(hue)]} />

      <View style={styles.body}>
        <View style={styles.header}>
          <Icon name="pencil" size={20} color={hue.base} />
          <Text style={styles.prompt}>{prompt}</Text>
        </View>

        <View>
          <View style={styles.rules} pointerEvents="none">
            {Array.from({ length: ruleCount }, (_, line) => (
              <View key={line} style={styles.rule} />
            ))}
          </View>
          <TextInput
            accessibilityLabel={prompt}
            autoCapitalize="sentences"
            maxLength={MOOD_NOTE_MAX_LENGTH}
            multiline
            onChangeText={onChange}
            onContentSizeChange={({ nativeEvent }) =>
              setRuleCount(
                Math.max(MIN_RULES, Math.ceil(nativeEvent.contentSize.height / RULE_HEIGHT)),
              )
            }
            placeholder="Type here…"
            placeholderTextColor={colors.text.tertiary}
            style={[styles.input, { minHeight: ruleCount * RULE_HEIGHT }]}
            textAlignVertical="top"
            value={value}
          />
        </View>

        <View style={styles.footer}>
          {prompts.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={spacing.sm}
              onPress={() => setPromptIndex((promptIndex + 1) % prompts.length)}
              style={({ pressed }) => [styles.shuffle, pressed && styles.shufflePressed]}
            >
              <Icon name="sparkle" size={16} color={hue.ink} />
              <Text style={[styles.shuffleLabel, { color: hue.ink }]}>New prompt</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text style={styles.count}>
            {value.length}/{MOOD_NOTE_MAX_LENGTH}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    ...card.paper,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  binding: {
    height: spacing.sm,
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prompt: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },

  rules: {
    ...StyleSheet.absoluteFillObject,
  },
  rule: {
    height: RULE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  input: {
    ...typography.body.large,
    lineHeight: RULE_HEIGHT,
    color: colors.text.primary,
    minHeight: RULE_HEIGHT * MIN_RULES,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shuffle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shufflePressed: {
    opacity: 0.6,
  },
  shuffleLabel: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
  },
  count: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
});
