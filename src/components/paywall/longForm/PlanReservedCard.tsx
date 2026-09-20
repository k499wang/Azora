import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import {
  formatCountdown,
  planReservationRemaining,
} from '../../../lib/paywall/paywallLongForm';

const TICK_MS = 1000;
const ICON_SIZE = 18;

/**
 * The hold on the plan, counting down.
 *
 * The clock is recomputed from the moment the page opened rather than
 * decremented, so it survives the app being backgrounded and can never drift
 * into claiming time that has already passed.
 */
export function PlanReservedCard() {
  const startedAtRef = useRef(Date.now());
  const [remaining, setRemaining] = useState(() =>
    planReservationRemaining(startedAtRef.current, Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(planReservationRemaining(startedAtRef.current, Date.now()));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Icon name="lock" size={ICON_SIZE} color={colors.neutral[0]} />
        <Text style={styles.title}>Personalized plan reserved</Text>
      </View>
      <Text style={styles.body}>
        Your personal plan has been saved for the next 15 minutes.
      </Text>
      <Text style={styles.expires}>expires in</Text>
      <Text style={styles.countdown}>{formatCountdown(remaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.error[700],
    borderRadius: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  body: {
    ...typography.body.medium,
    color: colors.neutral[0],
    opacity: 0.85,
    textAlign: 'center',
  },
  countdown: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
  },
  expires: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
    opacity: 0.75,
  },
});
