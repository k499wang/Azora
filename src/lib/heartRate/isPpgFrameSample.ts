import type { PpgFrameSample } from './types';

export function isPpgFrameSample(value: unknown): value is PpgFrameSample {
  if (value == null || typeof value !== 'object') return false;

  const sample = value as Partial<PpgFrameSample>;
  if (!Number.isFinite(sample.timestamp) || !Array.isArray(sample.rois)) {
    return false;
  }

  return (
    sample.rois.length > 0 &&
    sample.rois.every(
      (roi) =>
        roi != null &&
        typeof roi.id === 'string' &&
        Number.isFinite(roi.r) &&
        Number.isFinite(roi.g) &&
        Number.isFinite(roi.b) &&
        Number.isFinite(roi.saturatedPct) &&
        Number.isFinite(roi.darkPct) &&
        Number.isFinite(roi.variance),
    )
  );
}
