import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { padding, margin, spacing } from '../../theme/spacing';

interface HighlightCardsProps {
  bestHold?: string;
  avgHeartRate?: string;
}

const CIRCLE_SIZE = 120;

export default function HighlightCards({
  bestHold = '2:14',
  avgHeartRate = '64',
}: HighlightCardsProps) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.item}>
          <View style={styles.circle}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.primary.blue500} />
            <Text style={styles.value}>{bestHold}</Text>
            <Text style={styles.unit}>min</Text>
          </View>
          <Text style={styles.label}>Best hold</Text>
        </View>

        <View style={styles.item}>
          <View style={styles.circle}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.primary.blue500} />
            <Text style={styles.value}>{avgHeartRate}</Text>
            <Text style={styles.unit}>bpm</Text>
          </View>
          <Text style={styles.label}>Avg HR</Text>
        </View>
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
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    shadowColor: colors.primary.blue600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  value: {
    ...typography.title.title2,
    color: colors.text.primary,
  },
  unit: {
    ...typography.caption.caption2,
    color: colors.text.secondary,
    marginTop: -2,
  },
  label: {
    ...typography.label.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
