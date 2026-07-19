import { Text } from '../common/Text';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import CardSurface from '../common/CardSurface';

interface EmptyStateCardProps {
  title: string;
  subtitle: string;
}

export default function EmptyStateCard({ title, subtitle }: EmptyStateCardProps) {
  return (
    <CardSurface style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
