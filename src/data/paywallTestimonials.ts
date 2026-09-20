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
  {
    title: 'I can see my body settle',
    quote:
      'I take a heart rate reading before and after. Watching the number come down is what convinced me this was doing something real.',
    author: 'Nina Alvarez',
    avatar: 'testimonialNina',
  },
];
