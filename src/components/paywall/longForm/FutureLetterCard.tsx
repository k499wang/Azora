import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

interface FutureLetterCardProps {
  name?: string | null;
}

export function FutureLetterCard({ name }: FutureLetterCardProps) {
  const trimmed = name?.trim() ?? '';
  const hasName = trimmed.length > 0;
  const firstName = hasName ? trimmed.split(/\s+/)[0] : '';

  return (
    <View style={styles.card}>
      <Text style={styles.greeting}>
        {hasName ? `${firstName}, do you copy?` : 'Do you copy?'}
      </Text>

      <Text style={styles.body}>
        It's me, future you. I'm calling from today because this is an important day
        for you — for us.
      </Text>

      <Text style={styles.boldBody}>
        Today is the day we decided to change our lives for the better.
      </Text>

      <Text style={styles.body}>
        I have excellent news: I'm healthy, in great shape, and worry-free, thanks to
        the choices you're making.
      </Text>

      <Text style={styles.body}>I'll be with you every step of the way.</Text>

      <Text style={styles.signoff}>
        See you soon,{"\n"}Future {hasName ? firstName : 'you'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.playful.night.base,
    borderRadius: 20,
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
    gap: spacing.md,
  },
  greeting: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  body: {
    ...typography.body.medium,
    color: colors.neutral[0],
    opacity: 0.85,
    lineHeight: 24,
  },
  boldBody: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
    lineHeight: 28,
  },
  signoff: {
    ...typography.body.medium,
    fontStyle: 'italic',
    color: colors.neutral[0],
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
