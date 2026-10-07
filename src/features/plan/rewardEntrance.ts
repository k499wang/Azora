import { STAT_CARD_SPARKLE_LEAD_MS } from '../../components/common/HeaderStripStatCard';

const HERO_MAX = 260;
const HERO_WIDTH_RATIO = 0.62;
const HERO_HEIGHT_RATIO = 0.3;

export const REWARD_BEAT = {
  hero: 60,
  title: 280,
  subtitle: 380,
  cards: 500,
  cta: 660,
} as const;

/** Each result card on its own beat, the next arriving while the last's tab settles. */
const REWARD_CARD_STAGGER_MS = 520;

/** The first card's sparkles gather on the cards' beat; it arrives after them. */
export function rewardCardEnterAt(index: number): number {
  return REWARD_BEAT.cards + STAT_CARD_SPARKLE_LEAD_MS + index * REWARD_CARD_STAGGER_MS;
}

export function rewardHeroWidth(windowWidth: number, windowHeight: number): number {
  return Math.min(
    HERO_MAX,
    windowWidth * HERO_WIDTH_RATIO,
    windowHeight * HERO_HEIGHT_RATIO,
  );
}
