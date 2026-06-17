import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { PRO_INK } from '../../paywall/PlanCard';

interface PaywallStepDotsProps {
  count: number;
  current: number;
  dark: boolean;
}

export function PaywallStepDots({ count, current, dark }: PaywallStepDotsProps) {
  return (
    <View style={styles.stepDots}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            dark ? styles.stepDotDark : styles.stepDotLight,
            i === current && (dark ? styles.stepDotActiveDark : styles.stepDotActiveLight),
            i < current && (dark ? styles.stepDotPastDark : styles.stepDotPastLight),
          ]}
        />
      ))}
    </View>
  );
}

export default PaywallStepDots;

const styles = StyleSheet.create({
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepDotLight: {
    backgroundColor: colors.neutral[300],
  },
  stepDotDark: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stepDotPastLight: {
    backgroundColor: colors.neutral[400],
  },
  stepDotPastDark: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  stepDotActiveLight: {
    width: 22,
    backgroundColor: PRO_INK,
  },
  stepDotActiveDark: {
    width: 22,
    backgroundColor: colors.neutral[0],
  },
});
