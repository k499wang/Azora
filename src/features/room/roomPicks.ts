import { DECOR } from './RoomScene';
import type { DayKey, FrameHue, Picks } from './RoomScene';
import type { RoomDecorationRow } from '../../services/room/roomService';

/**
 * `slot` and `option_id` are free text in the database so the room's shape can
 * change without a migration — which means anything the app no longer knows how
 * to draw has to be dropped here rather than rendered as a gap.
 */
export function toPicks(decorations: RoomDecorationRow[]): Picks {
  const picks: Picks = {};

  for (const { slot, optionId } of decorations) {
    if (DECOR[`${slot}.${optionId}`] != null) {
      picks[slot as DayKey] = optionId;
    }
  }

  return picks;
}

export function toFrameHue(value: string | undefined): FrameHue {
  return value === 'teal' || value === 'blush' ? value : 'sky';
}
