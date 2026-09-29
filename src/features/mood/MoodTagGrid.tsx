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
import { StyleSheet, View } from 'react-native';
import MoodChip from './MoodChip';
import { MOOD_TAGS, MOOD_TAG_LIMIT } from './domain/moodTags';
import { spacing } from '../../theme/spacing';

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

        return (
          <MoodChip
            key={tag.id}
            label={tag.label}
            icon={tag.icon}
            chosen={isChosen}
            // A chip that cannot be added stays legible and stops responding,
            // rather than disappearing or silently doing nothing.
            disabled={atLimit && !isChosen}
            accessibilityRole="checkbox"
            onPress={() =>
              onChange(
                isChosen
                  ? selected.filter((id) => id !== tag.id)
                  : [...selected, tag.id],
              )
            }
          />
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
});
