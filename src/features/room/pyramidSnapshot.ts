/**
 * The whole pyramid, flattened into one texture.
 *
 * A room is roughly a hundred and fifty painted paths, and a `Picture` is a
 * recording rather than a raster — every frame replays every op in it. That is
 * cheap while a couple of rooms fill the screen and ruinous when the hotel is
 * standing back far enough to show fifty-five of them at once, which is exactly
 * the view it opens on: eight thousand anti-aliased paths per frame, sixty
 * times a second.
 *
 * So the far view is drawn once into an offscreen surface and shown as a single
 * textured quad. Pinch, drag and fling then cost one draw call no matter how
 * many rooms are in the pyramid — a hotel of fifty is exactly as smooth as a
 * hotel of three.
 *
 * The texture is sized against the viewport, not the pyramid: it is a
 * supersampled photograph of the home view, so it stays the same few megabytes
 * as floors are added instead of growing with them. `limit` is the scale past
 * which its texels are coarser than the screen's pixels — beyond that the
 * caller has to go back to drawing pictures, which is affordable again because
 * only a handful of rooms are on screen by then.
 */
import { Skia, type SkImage, type SkPicture } from '@shopify/react-native-skia';
import type { Bounds } from './pyramidLayout';

/** texels per screen pixel at the home scale — the room to zoom before it softens */
const OVERSAMPLE = 2;

/**
 * Every GPU this app runs on allows at least 4096, and most allow far more.
 * Only a tablet held in landscape gets near it.
 */
const MAX_TEXTURE = 4096;

export interface FarView {
  image: SkImage;
  /** where to draw it, in viewBox units */
  x: number;
  y: number;
  width: number;
  height: number;
  /** the scale past which the picture path looks better than this does */
  limit: number;
}

interface Options {
  pictures: SkPicture[];
  bounds: Bounds;
  /** the scale the pyramid opens at, from `fitToViewport` */
  homeScale: number;
  pixelRatio: number;
}

export function snapshotPyramid({
  pictures,
  bounds,
  homeScale,
  pixelRatio,
}: Options): FarView | null {
  if (pictures.length === 0 || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const wanted = homeScale * pixelRatio * OVERSAMPLE;
  const density = Math.min(
    wanted,
    MAX_TEXTURE / bounds.width,
    MAX_TEXTURE / bounds.height,
  );

  const width = Math.ceil(bounds.width * density);
  const height = Math.ceil(bounds.height * density);

  const surface = Skia.Surface.MakeOffscreen(width, height);
  // Not an error worth surfacing: the caller keeps drawing pictures, which is
  // what it did before this existed.
  if (surface == null) return null;

  const canvas = surface.getCanvas();
  canvas.scale(density, density);
  canvas.translate(-bounds.minX, -bounds.minY);
  for (const picture of pictures) canvas.drawPicture(picture);
  surface.flush();

  // `MakeOffscreen` is a GPU render target, so its snapshot is a texture on
  // that surface's context rather than a picture in its own right. Pulled onto
  // the CPU once here it becomes an ordinary raster image that any canvas can
  // draw, and the surface it came from is free to be collected — which is why
  // nothing disposes of it explicitly: the image would go with it.
  const image = surface.makeImageSnapshot().makeNonTextureImage();

  return {
    image,
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.width,
    height: bounds.height,
    limit: density / pixelRatio,
  };
}
