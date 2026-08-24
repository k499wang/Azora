/**
 * The way from this week's room to every room before it.
 *
 * It lives in Home's top bar beside the bell rather than over the room: a
 * control that only ever navigates belongs with the other navigation, and its
 * own row above the room spent a full width of the screen on one chip.
 *
 * The pyramid carries colour where the bell does not — it is the only door to
 * the hotel, and a grey glyph in a row of grey glyphs is not a door anyone
 * finds.
 */
import { useNavigation } from '@react-navigation/native';
import Icon from '../../components/common/icons/Icon';
import GlassIconButton from '../../components/common/GlassIconButton';
import type { MainTabNavigationProp } from '../../app/navigation';
import { colors } from '../../theme/colors';

const BUTTON_SIZE = 48;
const ICON_SIZE = 26;

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
