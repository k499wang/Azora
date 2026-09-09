import { slotNeighbours } from './pyramidLayout';

/**
 * Where the hotel's resident goes next.
 *
 * The blob lives in the whole hotel rather than in one room of it: it settles
 * in a room, wanders the floor there for a while, then crosses a wall into a
 * room next door. Only the choice of room is here — the walk inside a room is
 * `blobWalk`, and how any of it looks is `HotelBlob` and `RoomBlob`.
 *
 * It only ever steps to a room sharing a wall, so its path through the hotel is
 * a walk rather than a series of appearances, and it doubles back only when
 * there is nowhere else to go — a room at the end of a row would otherwise
 * bounce it against the wall for as long as you watched.
 */

/** the room it is in when the hotel opens: the one being filled right now */
export function firstRoom(occupied: number): number {
  return Math.max(0, occupied - 1);
}

/**
 * The next room, or null when there is nowhere to go — a hotel of one room, or
 * one whose rooms have gone away underneath the blob.
 *
 * `roll` is a 0..1 draw, taken by the caller so this stays pure.
 */
export function nextRoom(
  at: number,
  from: number | null,
  occupied: number,
  roll: number,
): number | null {
  const neighbours = slotNeighbours(at, occupied);
  if (neighbours.length === 0) return null;

  const onward =
    from == null ? neighbours : neighbours.filter((room) => room !== from);
  const choices = onward.length > 0 ? onward : neighbours;

  return choices[Math.min(choices.length - 1, Math.floor(roll * choices.length))];
}
