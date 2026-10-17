import Svg, { ClipPath, Defs, G, Polygon } from 'react-native-svg';
import { Polys } from '../room/RoomScene';
import { SEAL, SEAL_CENTER, SEAL_HALF_CLIPS } from './letterArt';

interface Props {
  size: number;
  broken?: boolean;
}

const VIEW_BOX = '-6 -6 112 112';
const [CX, CY] = SEAL_CENTER;
const toPoints = (ring: readonly (readonly [number, number])[]) => ring.map(([x, y]) => `${x},${y}`).join(' ');

export default function WaxSeal({ size, broken = false }: Props) {
  if (!broken) {
    return (
      <Svg width={size} height={size} viewBox={VIEW_BOX}>
        <Polys polys={SEAL} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Defs>
        <ClipPath id="sealLeft">
          <Polygon points={toPoints(SEAL_HALF_CLIPS.left)} />
        </ClipPath>
        <ClipPath id="sealRight">
          <Polygon points={toPoints(SEAL_HALF_CLIPS.right)} />
        </ClipPath>
      </Defs>
      <G transform={`translate(-3 0) rotate(-5 ${CX} ${CY})`}>
        <G clipPath="url(#sealLeft)">
          <Polys polys={SEAL} />
        </G>
      </G>
      <G transform={`translate(3 0) rotate(5 ${CX} ${CY})`}>
        <G clipPath="url(#sealRight)">
          <Polys polys={SEAL} />
        </G>
      </G>
    </Svg>
  );
}
