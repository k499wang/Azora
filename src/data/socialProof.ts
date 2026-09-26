import type { OnboardingImageKey } from '../services/images/onboardingImageCache';

/** Share of members who report approaching their habits better. */
export const IMPROVED_HABITS_PERCENT = 92;
/** How much better members report feeling after `FEEL_BETTER_DAYS`. */
export const FEEL_BETTER_PERCENT = 72;
export const FEEL_BETTER_DAYS = 20;

/** How many people use Azora. Every screen that quotes the number reads it from here. */
export const COMMUNITY_SIZE = '50,000';

/** Azora's App Store average. Keep in step with the live listing. */
export const APP_STORE_RATING = '4.9';

export interface ExpertReview {
  cardTitle: string;
  name: string;
  position: string;
  avatar: OnboardingImageKey;
  quote: string;
}

/**
 * The experts who reviewed the method. Real, named people who have agreed to
 * be quoted.
 */
export const EXPERT_REVIEWS: ExpertReview[] = [
  {
    cardTitle: 'Reviewed by an expert',
    name: 'Dr. Maya Bennett, PhD',
    position: 'Clinical Psychologist',
    avatar: 'expertMaya',
    quote: '“The plan helps users challenge unhelpful patterns and build healthier routines, one step at a time.”',
  },
  {
    cardTitle: 'Reviewed by an expert',
    name: 'Daniel Brooks, MSW, RSW',
    position: 'Registered Therapist',
    avatar: 'expertDaniel',
    quote: '“Azora makes CBT concepts simple and approachable, something users can practice throughout their day.”',
  },
];
