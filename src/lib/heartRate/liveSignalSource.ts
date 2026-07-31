import type { LivePpgSignalSample } from './types';

export interface LiveSignalSource {
  read: () => LivePpgSignalSample[];
}

export interface MutableLiveSignalSource extends LiveSignalSource {
  clear: () => void;
  publish: (samples: LivePpgSignalSample[]) => void;
}

const EMPTY_SAMPLES: LivePpgSignalSample[] = [];

/** Holds graph-only samples outside React state so publishing cannot rerender a session. */
export function createLiveSignalSource(): MutableLiveSignalSource {
  let snapshot = EMPTY_SAMPLES;

  return {
    read: () => snapshot,
    publish: (samples) => {
      snapshot = samples.length === 0 ? EMPTY_SAMPLES : samples;
    },
    clear: () => {
      snapshot = EMPTY_SAMPLES;
    },
  };
}
