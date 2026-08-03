import type { LivePpgSignalSample, SignalStatus } from './types';

const SAVITZKY_GOLAY_COEFFICIENTS = [-3, 12, 17, 12, -3] as const;
const SAVITZKY_GOLAY_DIVISOR = 35;
const SAVITZKY_GOLAY_RADIUS = 2;

export function smoothLiveSignalGraphSamples(
  samples: LivePpgSignalSample[],
): LivePpgSignalSample[] {
  const smoothed = samples.map((sample) => ({ ...sample }));
  if (samples.length < SAVITZKY_GOLAY_COEFFICIENTS.length) return smoothed;

  for (
    let index = SAVITZKY_GOLAY_RADIUS;
    index < samples.length - SAVITZKY_GOLAY_RADIUS;
    index += 1
  ) {
    let weightedValue = 0;
    for (
      let coefficientIndex = 0;
      coefficientIndex < SAVITZKY_GOLAY_COEFFICIENTS.length;
      coefficientIndex += 1
    ) {
      const sampleIndex = index + coefficientIndex - SAVITZKY_GOLAY_RADIUS;
      weightedValue +=
        samples[sampleIndex].value *
        SAVITZKY_GOLAY_COEFFICIENTS[coefficientIndex];
    }
    smoothed[index].value = weightedValue / SAVITZKY_GOLAY_DIVISOR;
  }

  return smoothed;
}

export function isGraphContaminated(signalStatus?: SignalStatus): boolean {
  return signalStatus === 'excessive_motion' || signalStatus === 'no_pulse';
}
