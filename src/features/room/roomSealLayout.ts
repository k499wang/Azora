import { ROOM_ASPECT } from './roomGeometry';
import { spacing } from '../../theme/spacing';
import type { RewardRoomBox } from './DailyRewardFlow';

export interface SealLayoutInput {
  windowWidth: number;
  windowHeight: number;
  insetTop: number;
  /** 0 until the tray has reported its height */
  trayHeight: number;
  /** the room's frame on the stage that handed over, if one did */
  from: RewardRoomBox | null;
}

export interface SealLayout {
  /** the height left for the room once the tray is paid for */
  free: number;
  roomWidth: number;
  roomHeight: number;
  roomLeft: number;
  roomTop: number;
  /** the tray has been measured, so the resting place is real */
  measured: boolean;
}

/**
 * Where the sealed room stands, as arithmetic rather than layout.
 *
 * A handed-over room keeps exactly the stage's size and place, including its
 * first frame before the tray reports. A standalone replay has no pose to
 * preserve, so once measured it fits the space above its tray.
 */
export function sealLayout({
  windowWidth,
  windowHeight,
  insetTop,
  trayHeight,
  from,
}: SealLayoutInput): SealLayout {
  const measured = trayHeight > 0;
  const free = windowHeight - insetTop - trayHeight - spacing.md * 2;

  const roomWidth =
    from == null
      ? Math.min(
          windowWidth - spacing.sm * 2,
          (measured ? Math.max(0, free) : windowHeight - insetTop) / ROOM_ASPECT,
        )
      : from.width * from.scale;
  const roomHeight = roomWidth * ROOM_ASPECT;

  // Centred in what the tray leaves — but only when nothing handed over. A
  // handover is not a layout: the room is already on screen, at a place the
  // stage chose, and the only correct thing to do with it is leave it there.
  // Anything else is a jump at the exact moment the room should be the
  // steadiest thing in the flow. The seal's tray matches the stage's sheet,
  // so the room already has the space it needs above it.
  const restTop = insetTop + spacing.md + (free - roomHeight) / 2;
  // The stage scales its room about the centre, so the centre is the only part
  // of its box that means anything here.
  const handoverTop =
    from == null
      ? restTop
      : from.y + (from.width * ROOM_ASPECT) / 2 - roomHeight / 2;

  return {
    free,
    roomWidth,
    roomHeight,
    roomLeft: (windowWidth - roomWidth) / 2,
    // One box for both phases: the room the week was replayed in and the room
    // being chosen are the same picture in the same place, and the pager's
    // caption and dots hang below it rather than moving it.
    roomTop: from == null && measured ? restTop : handoverTop,
    measured,
  };
}
