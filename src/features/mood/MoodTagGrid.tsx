/** Optional mood context, grouped so activities, people, and places are easy to find. */
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import MoodChip from './MoodChip';
import { MOOD_TAGS, MOOD_TAG_GROUPS, MOOD_TAG_LIMIT } from './domain/moodTags';
import { spacing } from '../../theme/spacing';

interface MoodTagGridProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function MoodTagGrid({ selected, onChange }: MoodTagGridProps) {
  const chosen = new Set(selected);
  const atLimit = chosen.size >= MOOD_TAG_LIMIT;

  return (
    <View style={styles.groups}>
      {MOOD_TAG_GROUPS.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <View style={styles.grid}>
            {MOOD_TAGS.filter((tag) => tag.group === group.id).map((tag) => {
              const isChosen = chosen.has(tag.id);
              return (
                <MoodChip
                  key={tag.id}
                  label={tag.label}
                  icon={tag.icon}
                  chosen={isChosen}
                  disabled={atLimit && !isChosen}
                  accessibilityRole="checkbox"
                  onPress={() => {
                    if (atLimit && !isChosen) return;
                    onChange(
                      isChosen
                        ? selected.filter((id) => id !== tag.id)
                        : [...selected, tag.id],
                    );
                  }}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: { gap: spacing.lg },
  group: { gap: spacing.sm },
  groupLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
