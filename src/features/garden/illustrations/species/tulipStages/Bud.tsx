import { G, Path, Ellipse } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';
const TULIP = '#F07E66';
const TULIP_DARK = '#D45F50';
const TULIP_LIGHT = '#FFB09B';

export default function TulipBudStage() {
  return (
    <G>
      <Path d="M96 145 C96 127 98 108 101 89 L109 89 C107 110 107 129 104 145 Z" fill={STEM} />
      <Path d="M101 126 C89 120 81 111 80 100 C92 103 100 111 103 120 Z" fill={LEAF} />
      <Path d="M105 119 C110 105 119 97 130 95 C128 108 119 118 106 123 Z" fill={LEAF} />
      <G transform="translate(-7 0)">
        <Path d="M104 94 C98 84 98 70 103 58 C107 53 112 49 116 46 C122 56 125 68 121 80 C118 89 112 94 104 94 Z" fill={TULIP} />
        <Path d="M105 91 C103 79 106 64 113 52 C117 64 119 78 112 92 Z" fill={TULIP_DARK} opacity={0.68} />
        <Ellipse cx={105} cy={63} rx={4} ry={9} fill={TULIP_LIGHT} opacity={0.74} transform="rotate(-14 105 63)" />
      </G>
    </G>
  );
}
