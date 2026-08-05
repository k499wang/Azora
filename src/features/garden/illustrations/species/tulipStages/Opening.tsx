import { G, Path, Ellipse } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';
const TULIP = '#F07E66';
const TULIP_DARK = '#D45F50';
const TULIP_LIGHT = '#FFB09B';

export default function TulipOpeningStage() {
  return (
    <G>
      <Path d="M96 145 C96 127 98 108 101 87 L109 87 C107 108 107 128 104 145 Z" fill={STEM} />
      <Path d="M101 126 C89 120 81 111 80 100 C92 103 100 111 103 120 Z" fill={LEAF} />
      <Path d="M105 119 C110 105 119 97 130 95 C128 108 119 118 106 123 Z" fill={LEAF} />
      <G transform="translate(-7 0)">
        <Path d="M103 89 C95 80 91 69 94 59 C102 60 108 67 110 77 C111 66 118 57 127 55 C131 67 126 80 113 89 Z" fill={TULIP_DARK} />
        <Path d="M105 87 C99 78 101 67 107 59 C113 65 114 75 111 83 C116 74 124 70 132 73 C130 83 122 90 112 91 Z" fill={TULIP} />
        <Ellipse cx={106} cy={70} rx={5} ry={11} fill={TULIP_LIGHT} opacity={0.8} transform="rotate(-13 106 70)" />
      </G>
    </G>
  );
}
