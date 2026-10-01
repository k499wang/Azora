import type { ViewStyle } from 'react-native';
import Pill from '../../components/common/Pill';
import { colors } from '../../theme/colors';

interface Props {
  style?: ViewStyle;
}

export default function PhotoCleanupFreeBadge({ style }: Props) {
  return (
    <Pill
      icon="sparkle"
      label="Your first cleanup is on Azo."
      backgroundColor={colors.playful.amber.soft}
      textColor={colors.playful.amber.ink}
      style={style}
    />
  );
}
