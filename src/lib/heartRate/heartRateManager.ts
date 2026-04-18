import type { FingerPlacementState, PpgFrameSample } from './types';
import { rgbToHsv } from './colorUtils';
import { Filter } from './filter';
import { INVALID_PULSE_PERIOD, PulseDetector } from './pulseDetector';

export interface HeartRateFrameState {
  fingerPlacement: FingerPlacementState;
  beatDetected: boolean;
  readyForMeasurement: boolean;
  signalText: string;
}

function averageRoiSample(sample: PpgFrameSample): { r: number; g: number; b: number } {
  const count = Math.max(1, sample.rois.length);
  const totals = sample.rois.reduce(
    (acc, roi) => ({
      r: acc.r + roi.r,
      g: acc.g + roi.g,
      b: acc.b + roi.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: totals.r / count,
    g: totals.g / count,
    b: totals.b / count,
  };
}

export class HeartRateManager {
  private validFrameCounter = 0;
  private measurementStartedFlag = false;
  private lastFingerState: FingerPlacementState = 'no_finger';
  private lastDetectorSignal = 0;
  private readonly filter = new Filter();
  private readonly pulseDetector = new PulseDetector();

  reset(): void {
    this.validFrameCounter = 0;
    this.measurementStartedFlag = false;
    this.lastFingerState = 'no_finger';
    this.lastDetectorSignal = 0;
    this.filter.reset();
    this.pulseDetector.reset();
  }

  processFrame(sample: PpgFrameSample): HeartRateFrameState {
    const averaged = averageRoiSample(sample);
    const hsv = rgbToHsv(averaged.r, averaged.g, averaged.b);

    if (hsv.s > 0.5 && hsv.v > 0.5) {
      this.validFrameCounter += 1;
      this.measurementStartedFlag = true;

      const filtered = this.filter.processValue(hsv.h);
      const detectorSignal = this.pulseDetector.addNewValue(filtered, sample.timestamp);
      const readyForMeasurement = this.validFrameCounter > 60;
      const beatDetected = readyForMeasurement && detectorSignal > 0 && this.lastDetectorSignal <= 0;
      this.lastDetectorSignal = detectorSignal;

      this.lastFingerState = readyForMeasurement ? 'good' : 'partial';
      return {
        fingerPlacement: this.lastFingerState,
        beatDetected,
        readyForMeasurement,
        signalText: readyForMeasurement ? 'Measuring pulse' : 'Warm up and hold steady',
      };
    }

    this.validFrameCounter = 0;
    this.measurementStartedFlag = false;
    this.filter.reset();
    this.pulseDetector.reset();
    this.lastFingerState = this.lastFingerState === 'good' ? 'lost' : 'no_finger';
    this.lastDetectorSignal = 0;

    return {
      fingerPlacement: this.lastFingerState,
      beatDetected: false,
      readyForMeasurement: false,
      signalText: this.lastFingerState === 'lost' ? 'Signal lost - hold steady' : 'Cover the back camera and flash',
    };
  }

  getAveragePeriod(): number {
    return this.pulseDetector.getAverage();
  }

  getCurrentBpm(): number | null {
    const average = this.getAveragePeriod();
    if (average === INVALID_PULSE_PERIOD || average <= 0) return null;
    return Math.round(60 / average);
  }
}
