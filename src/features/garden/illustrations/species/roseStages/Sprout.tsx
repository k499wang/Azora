import { G, Path } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';

export default function RoseSproutStage() {
  return (
    <G>
      <Path d="M96 145 C96 129 99 111 102 98 L110 98 C108 113 107 130 104 145 Z" fill={STEM} />
      <Path d="M103 124 C90 123 79 116 74 106 C87 105 98 111 104 118 Z" fill={LEAF} />
      <Path d="M105 115 C111 102 121 94 131 93 C129 105 119 115 106 120 Z" fill={LEAF} />
    </G>
  );
}
