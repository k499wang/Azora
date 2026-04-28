import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size: number;
}

export function BreathOrb({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="orbCore" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.primary.blue400} stopOpacity={1} />
          <Stop offset="100%" stopColor={colors.primary.blue600} stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <Circle cx={100} cy={100} r={96} fill={colors.primary.blue500} opacity={0.08} />
      <Circle cx={100} cy={100} r={78} fill={colors.primary.blue500} opacity={0.14} />
      <Circle cx={100} cy={100} r={60} fill={colors.primary.blue500} opacity={0.22} />
      <Circle cx={100} cy={100} r={44} fill="url(#orbCore)" />
      <Circle cx={86} cy={84} r={10} fill={colors.neutral[0]} opacity={0.3} />
    </Svg>
  );
}
