import { Text } from '../common/Text';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import CardSurface from '../common/CardSurface';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';

interface EmptyStateCardProps {
  title: string;
  subtitle: string;
  hue?: PlayfulHue;
}

export default function EmptyStateCard({ title, subtitle, hue }: EmptyStateCardProps) {
  return (
    <CardSurface style={styles.card} hue={hue}>
      <Text style={[styles.title, hue != null && styles.blockTitle]}>{title}</Text>
      <Text style={[styles.subtitle, hue != null && styles.blockSubtitle]}>{subtitle}</Text>
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
  blockTitle: {
    color: colors.text.inverse,
  },
  blockSubtitle: {
    color: colors.onBlock.textMuted,
  },
});
