import { duration } from '../../theme/motion';

const HERO_MAX = 260;
const HERO_WIDTH_RATIO = 0.62;
const HERO_HEIGHT_RATIO = 0.3;

export const REWARD_BEAT = {
  hero: 60,
  title: 280,
  subtitle: 380,
  cards: 500,
  cta: 660,
  /** Azo speaks once he and the headline have settled */
  speech: 760,
} as const;

export const REWARD_CARDS_LANDED_MS = REWARD_BEAT.cards + duration.slow;

export function rewardHeroWidth(windowWidth: number, windowHeight: number): number {
  return Math.min(
    HERO_MAX,
    windowWidth * HERO_WIDTH_RATIO,
    windowHeight * HERO_HEIGHT_RATIO,
  );
}
