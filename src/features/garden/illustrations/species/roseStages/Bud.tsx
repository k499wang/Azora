import { G, Path, Ellipse } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';
const ROSE = '#E47793';
const ROSE_DARK = '#C95778';
const ROSE_LIGHT = '#F4A5B9';

export default function RoseBudStage() {
  return (
    <G>
      <Path d="M96 145 C96 127 99 108 102 91 L110 91 C108 111 107 129 104 145 Z" fill={STEM} />
      <Path d="M102 125 C90 123 79 116 75 106 C88 106 98 112 104 119 Z" fill={LEAF} />
      <Path d="M106 116 C113 104 123 100 133 103 C128 114 119 120 107 121 Z" fill={LEAF} />
      <G transform="translate(-7 0)">
        <Path d="M104 95 C95 89 92 80 96 69 C100 60 106 54 111 50 C118 58 122 67 121 77 C120 88 114 94 104 95 Z" fill={ROSE} />
        <Path d="M105 92 C101 82 102 71 108 58 C112 69 115 81 111 93 Z" fill={ROSE_DARK} opacity={0.72} />
        <Ellipse cx={102} cy={68} rx={4} ry={9} fill={ROSE_LIGHT} opacity={0.72} transform="rotate(-18 102 68)" />
      </G>
    </G>
  );
}
