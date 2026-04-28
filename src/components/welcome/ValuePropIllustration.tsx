import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size: number;
}

export function ValuePropIllustration({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Defs>
        <RadialGradient id="vpSun" cx="50%" cy="55%" r="50%">
          <Stop offset="0%" stopColor={colors.primary.blue400} stopOpacity={1} />
          <Stop offset="100%" stopColor={colors.primary.blue600} stopOpacity={1} />
        </RadialGradient>
      </Defs>

      <Path
        d="M20 168 Q120 92 220 168"
        stroke={colors.primary.blue200}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      <Path
        d="M40 176 Q120 116 200 176"
        stroke={colors.primary.blue300}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />

      <Circle cx={120} cy={140} r={56} fill={colors.primary.blue500} opacity={0.1} />
      <Circle cx={120} cy={140} r={42} fill={colors.primary.blue500} opacity={0.18} />
      <Circle cx={120} cy={140} r={30} fill="url(#vpSun)" />
      <Circle cx={112} cy={130} r={6} fill={colors.neutral[0]} opacity={0.35} />

      <Path
        d="M120 184 L120 198"
        stroke={colors.primary.blue500}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.3}
      />
      <Circle cx={68} cy={94} r={4} fill={colors.primary.blue400} opacity={0.55} />
      <Circle cx={186} cy={78} r={5} fill={colors.primary.blue400} opacity={0.45} />
      <Circle cx={170} cy={120} r={3} fill={colors.primary.blue300} opacity={0.6} />
      <Circle cx={56} cy={148} r={3} fill={colors.primary.blue300} opacity={0.6} />
    </Svg>
  );
}
