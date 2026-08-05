import { G, Path, Ellipse } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';
const ROSE = '#E47793';
const ROSE_DARK = '#C95778';
const ROSE_LIGHT = '#F4A5B9';

export default function RoseOpeningStage() {
  return (
    <G>
      <Path d="M96 145 C96 127 99 108 102 87 L110 87 C108 108 107 128 104 145 Z" fill={STEM} />
      <Path d="M102 125 C90 123 79 116 75 106 C88 106 98 112 104 119 Z" fill={LEAF} />
      <Path d="M106 116 C113 104 123 100 133 103 C128 114 119 120 107 121 Z" fill={LEAF} />
      <G transform="translate(-7 0)">
        <Path d="M103 91 C93 85 88 75 92 64 C100 64 107 70 109 80 C109 69 116 60 126 59 C130 71 125 83 113 90 Z" fill={ROSE_DARK} />
        <Path d="M105 88 C97 80 98 69 104 61 C111 65 114 74 111 82 C116 72 124 68 132 72 C130 82 122 89 113 91 Z" fill={ROSE} />
        <Path d="M106 88 C101 81 103 72 109 67 C115 72 116 80 112 87 Z" fill={ROSE_LIGHT} />
        <Ellipse cx={110} cy={84} rx={6} ry={4} fill="#FFD4DF" />
      </G>
    </G>
  );
}
