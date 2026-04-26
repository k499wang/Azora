import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type BadgeTone = 'blue' | 'orange' | 'green' | 'red';

export interface ProfileStatBadge {
  label: string;
  value: string;
  detail: string;
  icon: MaterialIconName;
  tone: BadgeTone;
}

interface ProfileStatsGridProps {
  badges: ProfileStatBadge[];
}

const TONE_STYLES: Record<
  BadgeTone,
  { iconBackground: string; iconColor: string; valueColor: string }
> = {
  blue: {
    iconBackground: colors.primary.blue100,
    iconColor: colors.primary.blue600,
    valueColor: colors.text.primary,
  },
  orange: {
    iconBackground: colors.orange[100],
    iconColor: colors.orange[700],
    valueColor: colors.orange[700],
  },
  green: {
    iconBackground: colors.success[100],
    iconColor: colors.success[700],
    valueColor: colors.success[700],
  },
  red: {
    iconBackground: colors.error[100],
    iconColor: colors.error[700],
    valueColor: colors.error[700],
  },
};

export default function ProfileStatsGrid({ badges }: ProfileStatsGridProps) {
  return (
    <View style={styles.grid}>
      {badges.map((badge) => {
        const tone = TONE_STYLES[badge.tone];

        return (
          <View key={badge.label} style={styles.badgeCard}>
            <View style={[styles.iconWrap, { backgroundColor: tone.iconBackground }]}>
              <MaterialCommunityIcons name={badge.icon} size={18} color={tone.iconColor} />
            </View>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
            <Text style={[styles.badgeValue, { color: tone.valueColor }]}>{badge.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    ...card.base,
    ...card.shadow,
    width: '48.5%',
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconWrap: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  badgeLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  badgeValue: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
