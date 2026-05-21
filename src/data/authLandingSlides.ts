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
    source: require('../../assets/onboarding/IMG_0140.webp'),
    title: 'See your heart health.',
    body: 'Get a real-time window into your nervous system through live HRV biofeedback.',
  },
  {
    id: 'performance',
    source: require('../../assets/onboarding/IMG_0142.webp'),
    title: 'See your performance.',
    body: 'Track how your body adapts over time and unlock insights into your recovery and readiness.',
  },
  {
    id: 'measure',
    source: require('../../assets/onboarding/IMG_0141.webp'),
    title: 'Measure your heart.',
    body: 'Live HRV biofeedback shows the exact moment your nervous system shifts into recovery.',
  },
];
