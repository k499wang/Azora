import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface EmptyStateCardProps {
  title: string;
  subtitle: string;
}

export default function EmptyStateCard({ title, subtitle }: EmptyStateCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
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
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
