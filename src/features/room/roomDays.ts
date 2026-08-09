import { DAYS } from './RoomScene';
import type { RoomSlot } from '../../lib/room/roomProgress';

export interface RoomDayOption {
  id: string;
  name: string;
}

export interface RoomDay {
  title: string;
  note: string;
  options: RoomDayOption[];
}

/**
 * What a slot is called and what can go in it. `DAYS` is authored inside the
 * generated asset file; this is the one place that reaches into it, so the
 * screens stay unaware of how the art happens to be organised.
 */
export function getRoomDay(slot: RoomSlot): RoomDay | null {
  return DAYS.find((day) => day.key === slot) ?? null;
}

/**
 * Just what the slot holds, for copy that names the reward — "Day 3 — Small
 * furniture" becomes "small furniture". The day number is an authoring detail
 * and means nothing to someone who missed a day.
 */
export function getRoomDayLabel(slot: RoomSlot): string | null {
  const title = getRoomDay(slot)?.title;
  if (title == null) {
    return null;
  }

  const label = title.split('—').at(-1)?.trim();
  return label == null || label === '' ? null : label.toLowerCase();
}
