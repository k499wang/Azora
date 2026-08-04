import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

export type CharacterId =
  | 'calm'
  | 'sleep'
  | 'focus'
  | 'energy'
  | 'balance'
  | 'hold';

// Deliberately not an ellipse — the control points are uneven so the body reads
// as a hand-drawn blob rather than a shape primitive.
const BODY_PATH =
  'M 50,24 C 70,24 84,37 83,56 C 82,73 69,85 50,85 C 31,85 17,74 17,56 C 16,37 30,24 50,24 Z';

const STROKE = 4;

interface BlobCharacterProps {
  character: CharacterId;
  faceExpression?: CharacterId;
  size: number;
  bodyColor: string;
  faceColor: string;
}

function Face({ character, faceColor }: { character: CharacterId; faceColor: string }) {
  const stroke = {
    stroke: faceColor,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  switch (character) {
    case 'calm':
      return (
        <G>
          <Path d="M 33,54 q 6,-8 12,0" {...stroke} />
          <Path d="M 55,54 q 6,-8 12,0" {...stroke} />
          <Path d="M 42,65 q 8,8 16,0" {...stroke} />
        </G>
      );
    case 'sleep':
      return (
        <G>
          <Path d="M 33,55 q 6,-5 12,0" {...stroke} />
          <Path d="M 55,55 q 6,-5 12,0" {...stroke} />
          <Ellipse cx={50} cy={67} rx={3.5} ry={4.5} fill={faceColor} />
        </G>
      );
    case 'focus':
      return (
        <G>
          <Path d="M 33,44 L 45,48" {...stroke} strokeWidth={3.5} />
          <Path d="M 67,44 L 55,48" {...stroke} strokeWidth={3.5} />
          <Circle cx={39} cy={56} r={4.5} fill={faceColor} />
          <Circle cx={61} cy={56} r={4.5} fill={faceColor} />
          <Path d="M 44,68 L 56,68" {...stroke} />
        </G>
      );
    case 'energy':
      return (
        <G>
          <Circle cx={38} cy={52} r={5} fill={faceColor} />
          <Circle cx={62} cy={52} r={5} fill={faceColor} />
          <Path d="M 39,63 a 11,11 0 0 0 22,0 Z" fill={faceColor} />
        </G>
      );
    case 'balance':
      return (
        <G>
          <Circle cx={38} cy={55} r={4.5} fill={faceColor} />
          <Path d="M 56,55 q 6,-7 12,0" {...stroke} />
          <Path d="M 43,66 q 7,6 14,0" {...stroke} />
        </G>
      );
    case 'hold':
      return (
        <G>
          <Circle cx={30} cy={64} r={7} fill={faceColor} fillOpacity={0.35} />
          <Circle cx={70} cy={64} r={7} fill={faceColor} fillOpacity={0.35} />
          <Path d="M 33,52 q 6,-7 12,0" {...stroke} />
          <Path d="M 55,52 q 6,-7 12,0" {...stroke} />
          <Circle cx={50} cy={66} r={4} fill={faceColor} />
        </G>
      );
  }
}

function Accessory({ character, bodyColor }: { character: CharacterId; bodyColor: string }) {
  switch (character) {
    case 'sleep':
      return (
        <Path
          d="M 80,10 a 10,10 0 1 0 9,12 a 8,8 0 1 1 -9,-12 Z"
          fill={bodyColor}
          fillOpacity={0.55}
        />
      );
    case 'energy':
      return (
        <Path
          d="M 85,6 L 74,22 L 81,22 L 76,36 L 90,17 L 83,17 Z"
          fill={bodyColor}
          fillOpacity={0.55}
        />
      );
    case 'focus':
      return (
        <Circle
          cx={81}
          cy={17}
          r={8}
          stroke={bodyColor}
          strokeOpacity={0.55}
          strokeWidth={3.5}
          fill="none"
        />
      );
    case 'calm':
    case 'balance':
      return (
        <G fill={bodyColor} fillOpacity={0.45}>
          <Circle cx={84} cy={16} r={5} />
          <Circle cx={14} cy={26} r={3.5} />
        </G>
      );
    case 'hold':
      return (
        <G fill={bodyColor} fillOpacity={0.45}>
          <Circle cx={82} cy={14} r={4} />
          <Circle cx={89} cy={25} r={2.5} />
        </G>
      );
  }
}

export default function BlobCharacter({
  character,
  faceExpression = character,
  size,
  bodyColor,
  faceColor,
}: BlobCharacterProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx={50} cy={89} rx={26} ry={4.5} fill={bodyColor} fillOpacity={0.18} />
      <Accessory character={character} bodyColor={bodyColor} />
      <Path d={BODY_PATH} fill={bodyColor} />
      <Face character={faceExpression} faceColor={faceColor} />
    </Svg>
  );
}
