export type CardSurfaceMode = 'solid' | 'glass';

// Shared card surface policy for metric/result cards that need to move between
// the legacy solid card treatment and the newer glass treatment together.
export const DEFAULT_CARD_SURFACE: CardSurfaceMode = 'solid';
