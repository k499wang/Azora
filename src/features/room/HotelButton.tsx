/**
 * The way from this week's room to every room before it.
 *
 * A pyramid in a glass chip in Home's top corner, scrolling away with the page
 * rather than riding over it. The chip is what says it is pressable — bare, it
 * read as decoration — and its colour is what marks it as the one door to the
 * hotel.
 */
import { useNavigation } from '@react-navigation/native';
import GlassIconButton from '../../components/common/GlassIconButton';
import Icon from '../../components/common/icons/Icon';
import type { MainTabNavigationProp } from '../../app/navigation';
import { colors } from '../../theme/colors';

const ICON_SIZE = 26;
/** the chip the icon sits in, sized so the whole circle is the tap target */
const BUTTON_SIZE = 46;

interface HotelButtonProps {
  floors: number;
}

export default function HotelButton({ floors }: HotelButtonProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  return (
    <GlassIconButton
      accessibilityLabel={`My hotel, ${floors} ${
        floors === 1 ? 'floor' : 'floors'
      }`}
      size={BUTTON_SIZE}
      variant="regular"
      onPress={() => navigation.navigate('Hotel')}
    >
      <Icon
        name="hotel-pyramid"
        size={ICON_SIZE}
        color={colors.playful.sky.base}
      />
    </GlassIconButton>
  );
}
