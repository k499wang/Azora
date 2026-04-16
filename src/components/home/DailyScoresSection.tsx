import { StyleSheet, View } from 'react-native';
import { padding, margin, spacing } from '../../theme/spacing';
import StatCircle from './StatCircle';

const SCORES = [
  { value: '1:42', label: 'Hold time' },
  { value: '62', unit: 'bpm', label: 'Heart rate' },
  { value: '88', label: 'Health score' },
];

export default function DailyScoresSection() {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        {SCORES.map((score) => (
          <StatCircle key={score.label} value={score.value} label={score.label} unit={score.unit} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
