import { G, Path, Ellipse } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';
const ROSE = '#E47793';
const ROSE_DARK = '#C95778';
const ROSE_LIGHT = '#F4A5B9';

export default function RoseBloomStage() {
  return (
    <G>
      <Path d="M96 145 C96 127 99 108 102 87 L110 87 C108 108 107 128 104 145 Z" fill={STEM} />
      <Path d="M102 125 C90 123 79 116 75 106 C88 106 98 112 104 119 Z" fill={LEAF} />
      <Path d="M106 116 C113 104 123 100 133 103 C128 114 119 120 107 121 Z" fill={LEAF} />
      <G transform="translate(-7 0)">
        <Path d="M104 91 C93 87 84 79 84 70 C93 65 103 68 109 77 C106 66 112 56 122 53 C130 62 128 73 118 82 C128 75 138 78 141 87 C133 95 121 95 111 88 Z" fill={ROSE_DARK} />
        <Path d="M106 88 C97 83 95 73 100 65 C107 66 112 72 112 80 C115 70 123 64 132 67 C135 77 128 86 118 89 C126 83 136 85 138 92 C129 98 117 95 109 90 Z" fill={ROSE} />
        <Path d="M108 88 C102 82 103 73 109 68 C116 72 117 80 113 87 C119 79 126 79 130 84 C127 91 118 94 110 90 Z" fill={ROSE_LIGHT} />
        <Ellipse cx={111} cy={86} rx={6} ry={4} fill="#FFD4DF" />
      </G>
    </G>
  );
}
