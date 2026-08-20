// Interaction state tokens. Every Pressable in the app should react visibly,
// but the reaction must be one of these three, not a hand-rolled opacity/scale
// invented per component. Reach for these via the `pressable` import.

export const pressable = {
  /** Cards and tiles: dim only, no scale — depth stays put. */
  surface: {
    opacity: 0.75,
  } as const,
  /** Icon buttons, avatars, streak pills: dim + shrink. */
  control: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  } as const,
  /** Banners and tertiary actions: gentle, barely-there feedback. */
  subtle: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  } as const,
  /** Disabled interactive elements. */
  disabled: {
    opacity: 0.5,
  } as const,
} as const;

export type PressableKind = keyof typeof pressable;