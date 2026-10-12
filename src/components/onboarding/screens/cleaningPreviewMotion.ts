export const CLEANING_PREVIEW_TIMELINE = {
  scanStart: 300,
  scanEnd: 1000,
  pinStarts: [1000, 1200, 1400],
  taskStarts: [1800, 2200, 2600],
  taskTravelDuration: 400,
  focusStart: 3300,
  wipeStart: 4500,
  wipeEnd: 5500,
  total: 6000,
} as const;

export interface CleaningPreviewLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CleaningPreviewPoint {
  x: number;
  y: number;
}

/** Photo and plan share a parent; task and badge layouts are relative to their own parents. */
export function getCleaningPinEndpoints(
  bounds: CleaningPreviewPoint,
  photo: CleaningPreviewLayout,
  plan: CleaningPreviewLayout,
  task: CleaningPreviewLayout,
  badge: CleaningPreviewLayout,
) {
  'worklet';
  return {
    start: {
      x: photo.x + bounds.x * photo.width,
      y: photo.y + bounds.y * photo.height,
    },
    end: {
      x: plan.x + task.x + badge.x + badge.width / 2,
      y: plan.y + task.y + badge.y + badge.height / 2,
    },
  };
}

export function getCleaningPinPosition(
  progress: number,
  start: CleaningPreviewPoint,
  end: CleaningPreviewPoint,
): CleaningPreviewPoint {
  'worklet';
  const along = Math.max(0, Math.min(1, progress));
  if (along === 0) return start;
  if (along === 1) return end;
  return {
    x: start.x + (end.x - start.x) * along,
    y: start.y + (end.y - start.y) * along - Math.sin(Math.PI * along) * 18,
  };
}

export function getCleaningWipeWidth(elapsed: number, photoWidth: number): number {
  'worklet';
  const along = Math.max(0, Math.min(1,
    (elapsed - CLEANING_PREVIEW_TIMELINE.wipeStart)
      / (CLEANING_PREVIEW_TIMELINE.wipeEnd - CLEANING_PREVIEW_TIMELINE.wipeStart),
  ));
  return Math.max(0, photoWidth) * along;
}
