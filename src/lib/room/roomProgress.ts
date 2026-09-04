/**
 * The rules for filling a room: which slot is next, and whether the user has
 * earned the right to fill it today.
 *
 * Pure on purpose — the service enforces these before writing and the UI reads
 * them to decide what to show, so they cannot live in either one.
 */

import { isDecorationReady } from './decorationDelivery';

/**
 * Slots are filled in this order and never skipped, so a missed day pauses the
 * sequence rather than leaving a permanent hole. Every room ends up complete;
 * a slow week just makes a longer one.
 *
 * Structurally identical to `DayKey` in `src/features/room/RoomScene.tsx`,
 * which is a generated asset file this module deliberately does not import.
 */
export const ROOM_SLOTS = [
  'day1',
  'day2',
  'day3',
  'day4',
  'day5',
  'day6',
  'day7',
] as const;

export type RoomSlot = (typeof ROOM_SLOTS)[number];

export const ROOM_SLOT_COUNT = ROOM_SLOTS.length;

export interface PlacedDecoration {
  slot: string;
  earnedLocalDate: string;
}

export interface RoomProgressInput {
  /** decorations in the room being filled right now */
  decorations: PlacedDecoration[];
  /**
   * The user's most recent earn date across every floor. Room-scoped state
   * cannot answer this: completing a room and opening the next one on the same
   * day would otherwise read as a fresh, unclaimed day.
   */
  lastEarnedLocalDate: string | null;
  todayLocalDate: string;
  dailiesComplete: boolean;
  /**
   * When today's earned piece can be placed, as epoch ms, or null when nothing
   * is waiting on a clock. Null is also the honest answer on a device that
   * never saw the day complete, and it reads as ready.
   */
  deliveryReadyAt?: number | null;
  /** only read while a delivery is pending */
  nowMs?: number;
}

export interface RoomProgress {
  placedCount: number;
  /** the slot a new object goes into, or null once the room is full */
  nextSlot: RoomSlot | null;
  isComplete: boolean;
  claimedToday: boolean;
  canClaim: boolean;
  /** the day is finished and the piece it earned has not arrived yet */
  awaitingDelivery: boolean;
  deliveryReadyAt: number | null;
}

function isRoomSlot(slot: string): slot is RoomSlot {
  return (ROOM_SLOTS as readonly string[]).includes(slot);
}

export function roomProgress({
  decorations,
  lastEarnedLocalDate,
  todayLocalDate,
  dailiesComplete,
  deliveryReadyAt = null,
  nowMs = Date.now(),
}: RoomProgressInput): RoomProgress {
  const filled = new Set(
    decorations.map((decoration) => decoration.slot).filter(isRoomSlot),
  );
  const placedCount = filled.size;
  // The first empty slot, not the slot at `placedCount`. They are the same once
  // slots only ever fill in order, but rooms decorated under the old free-for-
  // all picker have gaps, and indexing by count would eventually point at a
  // slot that is already taken — dead-ending the room for good.
  const nextSlot = ROOM_SLOTS.find((slot) => !filled.has(slot)) ?? null;
  const claimedToday = lastEarnedLocalDate === todayLocalDate;
  // A full room claims nothing until the next floor is opened — rolling over is
  // a choice the user makes, not something that happens to them.
  const earned = dailiesComplete && !claimedToday && nextSlot != null;
  const awaitingDelivery = earned && !isDecorationReady(deliveryReadyAt, nowMs);

  return {
    placedCount,
    nextSlot,
    isComplete: nextSlot == null,
    claimedToday,
    canClaim: earned && !awaitingDelivery,
    awaitingDelivery,
    deliveryReadyAt,
  };
}
