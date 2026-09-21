import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { GoalSuggestionCategory } from './goalSuggestions';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface Props {
  category: GoalSuggestionCategory;
  variant: 'row' | 'tile';
  onPress: () => void;
}

/** Shared category entry point; screens own the navigation destination. */
export default function RoutineCategoryCard({ category, variant, onPress }: Props) {
  const tile = variant === 'tile';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.label} routines`}
      accessibilityHint="Opens this routine category"
      onPress={() => { triggerTapHaptic(); onPress(); }}
      style={({ pressed }) => [card.base, card.shadow, tile ? styles.tile : styles.row, pressed && pressable.surface]}
    >
      <View style={[styles.iconBadge, tile && styles.tileIcon]}>
        <Icon name={category.icon} size={tile ? 38 : 32} color={colors.primary.blue500} />
      </View>
      <Text numberOfLines={tile ? 2 : 1} style={[styles.label, tile && styles.tileLabel]}>{category.label}</Text>
      {tile ? null : <Icon name="chevron-right" size={20} color={colors.text.tertiary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  tile: { width: 164, minHeight: 132, justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.card },
  iconBadge: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 42, height: 42 },
  label: { flex: 1, ...typography.body.large, fontFamily: fonts.semibold, color: colors.text.primary },
  tileLabel: { flex: 0 },
});
