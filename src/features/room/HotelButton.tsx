/**
 * The way from this week's room to every room before it.
 *
 * A bare pyramid in Home's top corner, scrolling away with the scene rather
 * than riding over it: the sky behind it is already the contrast a chrome
 * button would have supplied, and its colour is what marks it as the one door
 * to the hotel.
 */
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import type { MainTabNavigationProp } from '../../app/navigation';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';

const ICON_SIZE = 34;

interface HotelButtonProps {
  floors: number;
}

export default function HotelButton({ floors }: HotelButtonProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`My hotel, ${floors} ${
        floors === 1 ? 'floor' : 'floors'
      }`}
      hitSlop={spacing.md}
      style={({ pressed }) => (pressed ? pressable.control : undefined)}
      onPress={() => navigation.navigate('Hotel')}
    >
      <Icon
        name="hotel-pyramid"
        size={ICON_SIZE}
        color={colors.playful.sky.base}
      />
    </Pressable>
  );
}
