import { G, Path } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';
const TULIP = '#F07E66';
const TULIP_DARK = '#D45F50';
const TULIP_LIGHT = '#FFB09B';

export default function TulipBloomStage() {
  return (
    <G>
      <Path d="M96 145 C96 127 98 108 101 87 L109 87 C107 108 107 128 104 145 Z" fill={STEM} />
      <Path d="M101 126 C89 120 81 111 80 100 C92 103 100 111 103 120 Z" fill={LEAF} />
      <Path d="M105 119 C110 105 119 97 130 95 C128 108 119 118 106 123 Z" fill={LEAF} />
      <G transform="translate(-7 0)">
        <Path d="M102 90 C93 85 86 76 87 65 C96 62 104 67 109 77 C108 65 114 54 123 50 C130 61 127 75 116 85 C126 76 137 78 141 86 C134 96 120 96 110 90 Z" fill={TULIP_DARK} />
        <Path d="M105 88 C98 81 98 71 104 62 C111 66 113 74 111 82 C116 72 125 66 133 70 C134 80 126 89 114 91 C124 85 135 88 137 95 C127 101 114 96 107 90 Z" fill={TULIP} />
        <Path d="M108 88 C103 81 104 72 110 67 C116 72 117 79 113 86 C119 80 126 79 130 84 C127 92 118 94 110 90 Z" fill={TULIP_LIGHT} />
      </G>
    </G>
  );
}
