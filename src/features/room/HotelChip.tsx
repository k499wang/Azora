/**
 * The way from this week's room to every room before it.
 *
 * Small on purpose. It sits on the room itself — the one thing on Home people
 * already look at — and a chip there is seen more than a section further down
 * the screen would be, at a fraction of the space. The count is what earns it
 * the glance: a door is worth opening once, a number is worth checking.
 */
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { MainTabNavigationProp } from '../../app/navigation';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';

const ICON_SIZE = 16;
const CHEVRON_SIZE = 13;

interface HotelChipProps {
  floors: number;
}

export default function HotelChip({ floors }: HotelChipProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`My hotel, ${floors} ${
        floors === 1 ? 'floor' : 'floors'
      }`}
      // Small enough that its drawn size is below a comfortable touch target.
      hitSlop={spacing.sm}
      onPress={() => {
        triggerTapHaptic();
        navigation.navigate('Hotel');
      }}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Icon
        name="hotel-pyramid"
        size={ICON_SIZE}
        color={colors.text.primary}
      />
      <Text style={styles.label}>cl</Text>
      {/* Lighter than the label it follows: it says the chip goes somewhere
          without reading as a third thing to look at. */}
      <Icon
        name="chevron-right"
        size={CHEVRON_SIZE}
        color={colors.text.tertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm + spacing.xs / 2,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    backgroundColor: colors.background.card,
    // Raised rather than outlined: over artwork a chip that sits on the surface
    // reads as a control, where a flat one reads as a caption printed on it.
    ...card.shadow,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    // The same ink `SectionHeader` sets its titles in, so the chip reads as a
    // label on Home rather than a control borrowed from somewhere else.
    color: colors.text.primary,
  },
});
