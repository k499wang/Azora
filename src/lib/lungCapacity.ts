export type LungCapacityLabel =
  | 'Developing'
  | 'Steady'
  | 'Strong'
  | 'Exceptional';

export interface LungCapacityResult {
  exhaleSec: number;
  score: number;
  label: LungCapacityLabel;
}

const ANCHORS: { sec: number; score: number }[] = [
  { sec: 0, score: 0 },
  { sec: 5, score: 20 },
  { sec: 10, score: 50 },
  { sec: 20, score: 80 },
  { sec: 30, score: 100 },
];

function interpolateScore(exhaleSec: number): number {
  if (exhaleSec <= ANCHORS[0].sec) return ANCHORS[0].score;
  if (exhaleSec >= ANCHORS[ANCHORS.length - 1].sec) {
    return ANCHORS[ANCHORS.length - 1].score;
  }
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (exhaleSec >= a.sec && exhaleSec <= b.sec) {
      const t = (exhaleSec - a.sec) / (b.sec - a.sec);
      return a.score + t * (b.score - a.score);
    }
  }
  return 0;
}

function labelForScore(score: number): LungCapacityLabel {
  if (score >= 85) return 'Exceptional';
  if (score >= 65) return 'Strong';
  if (score >= 40) return 'Steady';
  return 'Developing';
}

export function colorForLabel(
  label: LungCapacityLabel,
  palette: {
    warning500: string;
    blue400: string;
    blue600: string;
    success500: string;
  },
): string {
  switch (label) {
    case 'Developing':
      return palette.warning500;
    case 'Steady':
      return palette.blue400;
    case 'Strong':
      return palette.blue600;
    case 'Exceptional':
      return palette.success500;
  }
}

export function scoreExhale(exhaleSec: number): LungCapacityResult {
  const clamped = Math.max(0, exhaleSec);
  const score = Math.round(interpolateScore(clamped));
  return {
    exhaleSec: Math.round(clamped * 10) / 10,
    score,
    label: labelForScore(score),
  };
}
