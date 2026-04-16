import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface StatCircleProps {
  value: string;
  label: string;
  unit?: string;
}

export default function StatCircle({ value, label, unit }: StatCircleProps) {
  return (
    <View style={styles.item}>
      <View style={styles.circle}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.elevated,
    borderWidth: 6,
    borderColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  value: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  unit: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    marginTop: -2,
  },
  label: {
    ...typography.body.xsmall,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 96,
  },
});
