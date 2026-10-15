import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { VIEW_BOX_HEIGHT, VIEW_BOX_WIDTH } from './roomGeometry';
import { Polys, type Poly } from './RoomScene';

/**
 * How far past its box Home keeps drawing, in viewBox units, so a piece grown
 * past the box edge is not clipped.
 */
export const HOME_ROOM_BLEED = 100;

interface Props {
  /** must match every other layer of the same room */
  width: number;
  polys: Poly[];
  /**
   * How far past the room's box to keep drawing, in viewBox units, so a piece
   * grown past the box edge is not clipped.
   */
  bleed?: number;
}

/**
 * One slice of the room, in the room's own coordinate space.
 *
 * Layers stack absolutely on a box the caller has already sized, so anything
 * drawn between two of them — the blob — lands at the depth it belongs to.
 */
function RoomLayer({ width, polys, bleed = 0 }: Props) {
  const u = width / VIEW_BOX_WIDTH;
  const vbW = VIEW_BOX_WIDTH + bleed * 2;
  const vbH = VIEW_BOX_HEIGHT + bleed * 2;

  return (
    <Svg
      width={vbW * u}
      height={vbH * u}
      viewBox={`${-vbW / 2} ${-vbH / 2} ${vbW} ${vbH}`}
      style={[styles.layer, { left: -bleed * u, top: -bleed * u }]}
      pointerEvents="none"
    >
      <Polys polys={polys} />
    </Svg>
  );
}

export default memo(RoomLayer);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
