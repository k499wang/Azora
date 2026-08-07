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
