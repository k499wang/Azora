import type { CaptureResult, PpgFrameSample } from './types';
import {
  analyzeFinalPpgCapture,
  deriveCaptureHrvResult,
  finalAnalysisToCaptureResult,
} from './finalAnalysis';

export { deriveCaptureHrvResult };

export function buildCaptureResult(
  samples: PpgFrameSample[],
): CaptureResult {
  return finalAnalysisToCaptureResult(analyzeFinalPpgCapture(samples));
}
