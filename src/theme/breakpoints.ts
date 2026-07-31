// iPhone SE (2nd/3rd gen) is 375 × 667. After safe areas it has roughly 110pt
// less usable height than a modern iPhone, which is where fixed-height heroes
// and generous vertical padding start clipping. These thresholds sit just above
// the SE so it and anything smaller resolve as short/narrow.
export const breakpoints = {
  shortHeight: 700,
  narrowWidth: 380,
} as const;

export function isShortScreen(height: number): boolean {
  return height <= breakpoints.shortHeight;
}

export function isNarrowScreen(width: number): boolean {
  return width <= breakpoints.narrowWidth;
}
