import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const QUOTES: { text: string; author?: string }[] = [
  { text: 'Breath is the bridge which connects life to consciousness.', author: 'Thích Nhất Hạnh' },
  { text: 'When the breath wanders, the mind is unsteady. When the breath is still, so is the mind.', author: 'Hatha Yoga Pradipika' },
  { text: 'Inhale the future, exhale the past.' },
  { text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.', author: 'Thích Nhất Hạnh' },
  { text: 'The quality of our breath expresses our inner feelings.', author: 'T. K. V. Desikachar' },
  { text: 'Just breathe.' },
  { text: 'Smile, breathe, and go slowly.', author: 'Thích Nhất Hạnh' },
];

function getDailyIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % QUOTES.length;
}

export default function DailyQuote() {
  const quote = QUOTES[getDailyIndex()];
  return (
    <View style={styles.container}>
      <Text style={styles.mark}>&ldquo;</Text>
      <Text style={styles.text}>{quote.text}</Text>
      {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    ...typography.display.display1,
    color: colors.text.tertiary,
    lineHeight: 36,
    marginBottom: -spacing.md,
  },
  text: {
    ...typography.title.title3,
    fontStyle: 'italic',
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 30,
  },
  author: {
    ...typography.label.medium,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
