export interface TechniqueRecommendation {
  id: string;
  name: string;
  tagline: string;
  why: string;
}

export const TECHNIQUE_RECOMMENDATIONS: Record<string, TechniqueRecommendation> = {
  relaxing: {
    id: 'relaxing',
    name: 'Relaxing Breath',
    tagline: 'Long, gentle exhales',
    why: 'Extended exhales activate your parasympathetic nervous system — the fastest way to calm acute stress.',
  },
  '478': {
    id: '478',
    name: '4-7-8 Breathing',
    tagline: 'Inhale 4 · hold 7 · exhale 8',
    why: 'Studied as a sleep aid: the long exhale and brief hold lower arousal and prepare your body for rest.',
  },
  resonance: {
    id: 'resonance',
    name: 'Resonance Breathing',
    tagline: '5.5 breaths per minute',
    why: 'The cadence that maximizes heart-rate variability — the single best lever for cardiovascular resilience.',
  },
  box: {
    id: 'box',
    name: 'Box Breathing',
    tagline: 'Equal in · hold · out · hold',
    why: 'Used by athletes and Navy SEALs for its simplicity — easy to remember, easy to repeat daily.',
  },
};

export const INTENT_TO_TECHNIQUE: Record<string, string> = {
  stress_relief: 'relaxing',
  focus: 'box',
  energy: 'box',
  spiritual: 'resonance',
  sleep: '478',
  heart_health: 'resonance',
  daily_habit: 'box',
  yoga: 'resonance',
  other: 'box',
};
