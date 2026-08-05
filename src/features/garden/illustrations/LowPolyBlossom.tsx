import { Circle, G, Path } from 'react-native-svg';

export interface LowPolyBlossomProps {
  x: number;
  y: number;
  scale?: number;
  petalColor?: string;
  centerColor?: string;
}

/** Small clean blossom accents used inside the illustrated garden bush. */
export default function LowPolyBlossom({
  x,
  y,
  scale = 1,
  petalColor = '#FFFDF1',
  centerColor = '#F2C84B',
}: LowPolyBlossomProps) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M0 0 C-7 -3 -7 -11 0 -14 C7 -11 7 -3 0 0 Z" fill={petalColor} />
      <Path d="M1 0 C4 -7 12 -7 15 -1 C13 6 6 7 1 3 Z" fill={petalColor} />
      <Path d="M1 1 C8 4 8 12 2 15 C-5 13 -6 6 -2 1 Z" fill={petalColor} />
      <Path d="M-1 1 C-5 7 -13 7 -15 1 C-12 -5 -5 -6 0 -2 Z" fill={petalColor} />
      <Path d="M-1 0 C-6 -5 -4 -12 1 -14 C6 -9 5 -3 2 1 Z" fill={petalColor} opacity={0.82} />
      <Circle cx={0} cy={0} r={3.2} fill={centerColor} />
      <Circle cx={-1} cy={-1} r={1.1} fill="#FFF5A7" />
    </G>
  );
}
