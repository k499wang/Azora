export interface TourRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourViewport {
  /** first x the overlay may draw on */
  safeLeft: number;
  /** last x the overlay may draw on */
  safeRight: number;
  /** first y the overlay may draw on, below the notch */
  safeTop: number;
  /** last y the overlay may draw on, above the tap-to-continue footer */
  safeBottom: number;
}

export interface ClusterPlacement {
  /** true when Mochi stands above the element and the arrow points down at it */
  pointsDown: boolean;
  top: number;
  /** shrinks only when the safe viewport itself is shorter than the cluster */
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** grows a measured element into the cutout drawn around it */
export function inflate(rect: TourRect, padding: number): TourRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * Puts Mochi on whichever side of the element actually has room for him, then
 * clamps him into the safe area — a tall or low element must never push him
 * half off the screen.
 */
export function placeCluster(
  hole: TourRect,
  viewport: TourViewport,
  clusterHeight: number,
  gap: number,
): ClusterPlacement {
  const safeBottom = Math.max(viewport.safeTop, viewport.safeBottom);
  const height = Math.min(
    Math.max(0, clusterHeight),
    safeBottom - viewport.safeTop,
  );
  const roomAbove = hole.y - gap - viewport.safeTop;
  const roomBelow = safeBottom - (hole.y + hole.height + gap);

  const pointsDown =
    roomBelow >= height
      ? false
      : roomAbove >= height
        ? true
        : roomAbove > roomBelow;

  const preferred = pointsDown
    ? hole.y - gap - height
    : hole.y + hole.height + gap;

  return {
    pointsDown,
    height,
    top: clamp(
      preferred,
      viewport.safeTop,
      safeBottom - height,
    ),
  };
}

/**
 * Whether a measured element is actually on screen.
 *
 * A measurement taken while a list is still settling can land far outside the
 * viewport. Drawing that cutout gives a fully dark screen with the highlight
 * nowhere to be seen, so a rect that fails this is re-scrolled rather than used.
 */
export function isOnScreen(
  rect: TourRect,
  viewport: TourViewport,
  minVisible: number,
): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;

  const visibleLeft = Math.max(rect.x, viewport.safeLeft);
  const visibleRight = Math.min(rect.x + rect.width, viewport.safeRight);
  const visibleTop = Math.max(rect.y, viewport.safeTop);
  const visibleBottom = Math.min(rect.y + rect.height, viewport.safeBottom);
  const requiredWidth = Math.min(minVisible, rect.width);
  const requiredHeight = Math.min(minVisible, rect.height);

  return (
    visibleRight - visibleLeft >= requiredWidth &&
    visibleBottom - visibleTop >= requiredHeight
  );
}

/**
 * How far along the cluster the arrow sits, so it points at the element's own
 * centre rather than the middle of the screen. Clamped so a right-aligned
 * control still keeps the arrow inside the cluster's bounds.
 */
export function arrowOffsetX(
  hole: TourRect,
  clusterLeft: number,
  clusterWidth: number,
  arrowWidth: number,
): number {
  const elementCentre = hole.x + hole.width / 2;
  return clamp(
    elementCentre - clusterLeft - arrowWidth / 2,
    0,
    Math.max(0, clusterWidth - arrowWidth),
  );
}

/**
 * The scroll offset that brings a measured element to `desiredTop`. Each step
 * scrolls unconditionally so the tour visibly walks down the page.
 */
export function scrollOffsetFor(
  rect: TourRect,
  currentOffset: number,
  desiredTop: number,
): number {
  return Math.max(0, currentOffset + rect.y - desiredTop);
}
