import { G, Path } from 'react-native-svg';

const STEM = '#4F9863';
const LEAF = '#74B96C';

export default function TulipSproutStage() {
  return (
    <G>
      <Path d="M96 145 C96 130 98 114 101 99 L109 99 C107 116 107 131 104 145 Z" fill={STEM} />
      <Path d="M101 126 C89 120 81 111 80 100 C92 103 100 111 103 120 Z" fill={LEAF} />
      <Path d="M105 119 C109 105 119 95 129 91 C129 104 119 115 106 123 Z" fill={LEAF} />
    </G>
  );
}
