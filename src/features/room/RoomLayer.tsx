import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { ROOM_ASPECT, VIEW_BOX } from './roomGeometry';
import { Polys, type Poly } from './RoomScene';

interface Props {
  /** must match every other layer of the same room */
  width: number;
  polys: Poly[];
}

/**
 * One slice of the room, in the room's own coordinate space.
 *
 * Layers stack absolutely on a box the caller has already sized, so anything
 * drawn between two of them — the blob — lands at the depth it belongs to.
 */
function RoomLayer({ width, polys }: Props) {
  return (
    <Svg
      width={width}
      height={width * ROOM_ASPECT}
      viewBox={VIEW_BOX}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Polys polys={polys} />
    </Svg>
  );
}

export default memo(RoomLayer);
