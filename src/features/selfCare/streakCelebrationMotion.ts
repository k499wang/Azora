/** One timeline for the screen bloom, flame, and earned streak. */
export const streakCelebrationMotion = {
  igniteAt: 1100,
  bloomDuration: 480,
  countAt: 1600,
  countDuration: 380,
  labelAt: 2050,
  weekAt: 2400,
  todayAt: 2650,
  copyAt: 2850,
  continueAt: 3500,
  revealDuration: 240,
} as const;

export const streakCelebrationColors = {
  dark: '#131f24',
  orange: '#ff8c00',
  yellow: '#ffdc32',
  cream: '#fff4c7',
  dormant: '#45565e',
} as const;

export const STREAK_IGNITE_AT = streakCelebrationMotion.igniteAt;
