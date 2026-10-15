import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Polys } from './RoomScene';
import { VIEW_BOX_HEIGHT, VIEW_BOX_WIDTH } from './roomGeometry';
import { roomShellSurfaces, roomShellWorld } from './roomShells';

/**
 * How far past the room's own box the patterned world is drawn. Below, only far
 * enough to pass under the top of the sheet the page lays over it.
 */
const ABOVE_PT = 160;
const BELOW_PT = 160;
/**
 * Above the drawn world the walls are flat colour, so an overscroll bounce
 * pulls in more room instead of bare page without a taller svg to rasterise.
 */
const FLAT_PT = 1600;

interface Props {
  shell: string | undefined;
  /** the room's own box width, which sets the scale */
  roomWidth: number;
  /** how wide to carry the room, centred on it */
  width: number;
  /** how far to carry the floor below the room's box, in points */
  below?: number;
}

/**
 * The room's walls and floor carried out past its hexagon to the screen edges
 * and beyond the scroll, so the room is the page rather than a box sitting on
 * it. Drawn behind the room's own layers, inside its box, on the same scale.
 */
function RoomWorld({ shell, roomWidth, width, below = BELOW_PT }: Props) {
  const scale = roomWidth / VIEW_BOX_WIDTH;
  const roomHeight = (roomWidth * VIEW_BOX_HEIGHT) / VIEW_BOX_WIDTH;
  const height = ABOVE_PT + roomHeight + below;

  const bounds = useMemo(
    () => ({
      halfWidth: width / 2 / scale,
      top: -VIEW_BOX_HEIGHT / 2 - ABOVE_PT / scale,
      bottom: VIEW_BOX_HEIGHT / 2 + below / scale,
    }),
    [below, scale, width],
  );
  const polys = useMemo(() => roomShellWorld(shell, bounds), [bounds, shell]);
  const surfaces = roomShellSurfaces(shell);
  const viewBox = `${-bounds.halfWidth} ${bounds.top} ${bounds.halfWidth * 2} ${bounds.bottom - bounds.top}`;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.world,
        { left: (roomWidth - width) / 2, top: -ABOVE_PT - FLAT_PT, width },
      ]}
    >
      <View style={styles.walls}>
        <View style={[styles.half, { backgroundColor: surfaces.wallLeft }]} />
        <View style={[styles.half, { backgroundColor: surfaces.wallRight }]} />
      </View>
      <Svg width={width} height={height} viewBox={viewBox}>
        <Polys polys={polys} />
      </Svg>
    </View>
  );
}

export default memo(RoomWorld);

const styles = StyleSheet.create({
  world: {
    position: 'absolute',
  },
  walls: {
    height: FLAT_PT,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
  },
});
