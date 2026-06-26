import type { ImageSourcePropType } from 'react-native';

export interface AuthLandingSlide {
  id: string;
  source: ImageSourcePropType;
  title: string;
  body: string;
}

export const AUTH_LANDING_SLIDES: AuthLandingSlide[] = [
  {
    id: 'health',
    source: require('../../assets/auth-landing-home.webp'),
    title: 'Breath with ease.',
    body: 'Get a real-time window into your nervous system through live HRV biofeedback.',
  },
  {
    id: 'performance',
    source: require('../../assets/auth-landing-score.webp'),
    title: 'See your performance.',
    body: 'Track how your body adapts over time and unlock insights into your recovery and readiness.',
  },
  {
    id: 'measure',
    source: require('../../assets/auth-landing-heart.webp'),
    title: 'Measure your heart.',
    body: 'Live HRV biofeedback shows the exact moment your nervous system shifts into recovery.',
  },
];
