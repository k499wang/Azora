import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../../theme/colors';

const W = 220;
const H = 140;

export default function BaselineHero() {
  return (
    <View style={styles.wrap}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary.blue100} stopOpacity={0.9} />
            <Stop offset="1" stopColor={colors.primary.blue100} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="phone" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background.elevated} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.primary.blue100} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="finger" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary.blue300} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.primary.blue500} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="20" width={W} height={H - 20} rx={28} fill="url(#plate)" />

        <G>
          <Rect
            x={W / 2 - 36}
            y={18}
            width={72}
            height={108}
            rx={16}
            fill="url(#phone)"
            stroke={colors.primary.blue600}
            strokeWidth={2}
          />
          <Circle
            cx={W / 2}
            cy={36}
            r={24}
            fill={colors.primary.blue200}
            opacity={0.35}
          />
          <Circle
            cx={W / 2}
            cy={36}
            r={16}
            fill={colors.primary.blue300}
            opacity={0.55}
          />
          <Circle cx={W / 2} cy={36} r={8} fill={colors.primary.blue700} />
          <Circle cx={W / 2 - 2} cy={34} r={2} fill={colors.neutral[0]} opacity={0.6} />

          <Path
            d={`
              M ${W / 2 - 26} 30
              C ${W / 2 - 26} 8, ${W / 2 - 10} -4, ${W / 2} 6
              C ${W / 2 + 10} -4, ${W / 2 + 26} 8, ${W / 2 + 26} 30
              C ${W / 2 + 26} 44, ${W / 2 + 14} 54, ${W / 2} 54
              C ${W / 2 - 14} 54, ${W / 2 - 26} 44, ${W / 2 - 26} 30
              Z
            `}
            fill="url(#finger)"
            stroke={colors.primary.blue700}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.95}
          />

          <Path
            d={`M ${W / 2 - 16} 22 C ${W / 2 - 12} 16, ${W / 2 - 4} 12, ${W / 2 - 2} 18`}
            stroke={colors.neutral[0]}
            strokeWidth={1.2}
            strokeOpacity={0.5}
            fill="none"
            strokeLinecap="round"
          />
        </G>

        <G opacity={0.75}>
          <Path
            d={`M ${W / 2 - 60} 110 L ${W / 2 - 40} 110 L ${W / 2 - 32} 96 L ${W / 2 - 24} 122 L ${W / 2 - 16} 104 L ${W / 2 - 8} 110 L ${W / 2 + 60} 110`}
            stroke={colors.primary.blue600}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
