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

export const NEW_ROOM_THANKS = [
  'A new room! Thank you for growing with me.',
  'Look at all this room for cozy things!',
  'New room, same happy little me.',
  'I love our new home already. Thank you!',
  'A fresh room for our next little chapter.',
  'So much space for new happy memories!',
  'You picked this for us? I love it!',
  'I am moving in my happy wiggle first.',
  'New home! Let us make it cozy together.',
  'Another room, another place to grow.',
] as const;

/** The first loaded room is a baseline, not a newly earned room. */
export function hasNewRoom(seenRoomId: string | null | undefined, room: Room | null): boolean {
  return seenRoomId !== undefined && room != null && room.id !== seenRoomId;
}

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
export function nextGreetingIndex(previous: number, lineCount: number, random: () => number = Math.random): number {
  const choices = lineCount - (previous < 0 ? 0 : 1);
  const pick = Math.floor(random() * choices);
  return previous >= 0 && pick >= previous ? pick + 1 : pick;
}
