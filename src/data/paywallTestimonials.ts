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

/** Shorter reviews for the onboarding community screen. Same mockup status as above. */
export const COMMUNITY_REVIEWS: PaywallTestimonial[] = [
  {
    title: 'I stopped putting things off',
    quote:
      'Small daily steps got me moving on things I had avoided for months. I stopped waiting to feel ready and just started.',
    author: 'Nina Alvarez',
    avatar: 'testimonialNina',
  },
  {
    title: 'My evenings are calm again',
    quote:
      'I used to lie awake replaying the day. Now I actually switch off at night, and mornings feel so much easier.',
    author: 'Maya Rivera',
    avatar: 'testimonialMaya',
  },
  {
    title: 'On top of things again',
    quote:
      'My to-do list stopped running my life. I know what matters today and I get it done without the guilt.',
    author: 'Jackie Koch',
    avatar: 'testimonialDaniel',
  },
  {
    title: 'Fits into my busiest days',
    quote:
      'I do not have an hour for myself. Five minutes a day was all it took to feel steadier all week.',
    author: 'Priya Shah',
    avatar: 'testimonialPriya',
  },
];

/** The review shown just before the plan is built, about following one. Same mockup status as above. */
export const PLAN_REVIEW: PaywallTestimonial = {
  title: 'I thought I was just lazy',
  quote:
    'I spent whole weekends in bed scrolling. One tiny step a day got me moving, and a month later I actually get stuff done.',
  author: 'Maya Bennett',
  avatar: 'testimonialMayaBennett',
};
