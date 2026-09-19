/**
 * What else was going on, as a wrap of chips.
 *
 * The one page of the check-in that does not answer itself and move on: the
 * scales take exactly one tap each, and this takes none, one or five. So it
 * has a button, and the button says "Done" rather than "Next" — the page is
 * finished when the user says it is, and skipping it is finishing it.
 *
 * Icon and word together, never the icon alone: the glyph is what makes a
 * chip findable in a wrap of nineteen without reading them all, and the word
 * is what makes it unambiguous once found.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { MOOD_TAGS, MOOD_TAG_LIMIT } from './domain/moodTags';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const CHIP_ICON = 18;

interface MoodTagGridProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function MoodTagGrid({ selected, onChange }: MoodTagGridProps) {
  const chosen = new Set(selected);
  const atLimit = chosen.size >= MOOD_TAG_LIMIT;

  return (
    <View style={styles.grid}>
      {MOOD_TAGS.map((tag) => {
        const isChosen = chosen.has(tag.id);
        // A chip that cannot be added stays legible and stops responding,
        // rather than disappearing or silently doing nothing.
        const disabled = atLimit && !isChosen;

        return (
          <Pressable
            key={tag.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChosen, disabled }}
            accessibilityLabel={tag.label}
            disabled={disabled}
            onPress={() => {
              triggerTapHaptic();
              onChange(
                isChosen
                  ? selected.filter((id) => id !== tag.id)
                  : [...selected, tag.id],
              );
            }}
            style={({ pressed }) => [
              styles.chip,
              isChosen && styles.chipChosen,
              disabled && styles.chipDisabled,
              pressed && styles.chipPressed,
            ]}
          >
            <Icon
              name={tag.icon}
              size={CHIP_ICON}
              color={isChosen ? colors.playful.sky.ink : colors.text.tertiary}
            />
            <Text style={[styles.label, isChosen && styles.labelChosen]}>
              {tag.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  chipChosen: {
    backgroundColor: colors.playful.sky.soft,
    borderColor: colors.playful.sky.base,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  labelChosen: {
    color: colors.playful.sky.ink,
  },
});
