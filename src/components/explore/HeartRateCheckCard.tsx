import { useNavigation } from '@react-navigation/native';
import type { MainTabNavigationProp } from '../../app/navigation';
import { colors } from '../../theme/colors';
import ExploreActionCard from './ExploreActionCard';

export default function HeartRateCheckCard() {
  const navigation = useNavigation<MainTabNavigationProp<'Explore'>>();

  return (
    <ExploreActionCard
      title="Measure your heart rate"
      subtitle="See your stress and recovery"
      hue={colors.playful.coral}
      glyph="ripple"
      accessibilityLabel="Measure your heart rate"
      accessibilityHint="Starts a heart rate measurement"
      onPress={() => navigation.navigate('HeartRate')}
    />
  );
}
