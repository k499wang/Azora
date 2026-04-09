import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding, margin } from '../../theme/spacing';

interface HighlightCardsProps {
  bestHold?: string;
  avgHeartRate?: string;
}

export default function HighlightCards({
  bestHold = '2:14',
  avgHeartRate = '64',
}: HighlightCardsProps) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={[styles.card, styles.cardBlue]}>
          <View style={styles.cardTop}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.primary.blue600} />
            <Text style={[styles.label, styles.labelBlue]}>Best hold</Text>
          </View>
          <Text style={styles.value}>{bestHold}</Text>
          <Text style={styles.unit}>minutes</Text>
          <View style={[styles.accent, styles.accentBlue]} />
        </View>

        <View style={[styles.card, styles.cardRed]}>
          <View style={styles.cardTop}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.primary.blue600} />
            <Text style={[styles.label, styles.labelBlue]}>Avg HR</Text>
          </View>
          <Text style={styles.value}>{avgHeartRate}</Text>
          <Text style={styles.unit}>bpm</Text>
          <View style={[styles.accent, styles.accentBlue]} />
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
    gap: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: spacing.md,
    overflow: 'hidden',
  },
  cardBlue: {
    backgroundColor: colors.background.accentSoft,
  },
  cardRed: {
    backgroundColor: colors.background.accentSoft,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label.small,
  },
  labelBlue: {
    color: colors.primary.blue600,
  },
  value: {
    ...typography.display.display3,
    color: colors.text.primary,
  },
  unit: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  accentBlue: {
    backgroundColor: colors.primary.blue500,
  },
});
