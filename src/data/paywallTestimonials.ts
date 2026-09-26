import type { OnboardingImageKey } from '../services/images/onboardingImageCache';

/**
 * Mockup content. Replace with verbatim App Store reviews, real reviewer names
 * and real headshots before shipping.
 */
export interface PaywallTestimonial {
  title: string;
  quote: string;
  author: string;
  avatar: OnboardingImageKey;
}

export const PAYWALL_TESTIMONIALS: PaywallTestimonial[] = [
  {
    title: 'I stopped fighting the stress',
    quote:
      'Azora helped me stop the endless cycle of overthinking and everyday stress. It reconnected me with my body, and now I know how to calm my nervous system instead of fighting it.',
    author: 'Nina Alvarez',
    avatar: 'testimonialNina',
  },
  {
    title: 'My new bedtime routine',
    quote:
      'I started using Azora when I could not switch my brain off at night. Now winding down is something I look forward to instead of something I dread.',
    author: 'Maya Rivera',
    avatar: 'testimonialMaya',
  },
  {
    title: 'The stress does not follow me home',
    quote:
      'I used to carry every hard day into the evening. One reset at my desk and I walk in the door as myself again.',
    author: 'Jackie Koch',
    avatar: 'testimonialDaniel',
  },
  {
    title: 'Looking after myself finally fits',
    quote:
      'I do not have an hour to give myself. Five minutes a day turned out to be enough to feel steadier all week.',
    author: 'Priya Shah',
    avatar: 'testimonialPriya',
  },
];
