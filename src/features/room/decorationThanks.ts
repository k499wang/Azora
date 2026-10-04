import type { Room } from '../../services/room/roomService';

export const DECORATION_THANKS = [
  'Thank you! I love my new decoration.',
  'Ooh, this is perfect. Thank you!',
  'You decorated for me? Thank you!',
  'My room feels cozier already. Thanks!',
  'Best gift ever. Thank you, friend.',
  'I keep looking at it. Thank you!',
  'Thank you! It fits right in here.',
  'This makes my room feel like home.',
  'Wow, a new piece! You spoil me.',
  'Thank you! I will take good care of it.',
  'It is perfect. I am doing a happy wiggle.',
  'You did this for me? I am so happy!',
  'Thanks! My room is getting so fancy.',
  'I already know where I will nap near it.',
  'Thank you! This room keeps getting better.',
  'You showed up, and look what I got!',
  'Thanks for the upgrade! Very stylish.',
  'Thank you! I will tell all my friends.',
  'One more piece of home. Thank you!',
  'Thank you! You make this place special.',
] as const;

/** One key per placed piece, unique across every room the user fills. */
export function roomDecorationKeys(room: Room | null): string[] {
  if (room == null) return [];
  return room.decorations.map((decoration) => `${room.id}:${decoration.slot}`);
}

export function hasNewDecoration(
  seen: ReadonlySet<string>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => !seen.has(key));
}

/** A random line, never the one he said last time. */
export function nextThanksIndex(previous: number, random: () => number = Math.random): number {
  const choices = DECORATION_THANKS.length - (previous < 0 ? 0 : 1);
  const pick = Math.floor(random() * choices);
  return previous >= 0 && pick >= previous ? pick + 1 : pick;
}
