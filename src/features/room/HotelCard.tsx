import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';

/**
 * The way into the hotel.
 *
 * It is the only one — nothing else in the app leads there — so it stands from
 * the first room rather than waiting for a second. A door that appears a week
 * in is a door most people never find.
 */
interface HotelCardProps {
  /** the floor being decorated now; null before the first piece is ever placed */
  floor: number | null;
}

export default function HotelCard({ floor }: HotelCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  if (floor == null || floor < 1) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your hotel"
      onPress={() => navigation.navigate('Hotel')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Icon name="hotel-pyramid" size={40} color={colors.primary.blue600} />
      <Text style={styles.title}>Your hotel</Text>
      <Icon name="chevron-right" size={28} color={colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    ...typography.title.title2,
    flex: 1,
    color: colors.text.primary,
  },
});
