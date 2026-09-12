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
 * The room is the one thing carried across the celebration, the stage and the
 * seal, so its size may not depend on anything this screen has yet to measure —
 * sized off the tray it could not be drawn on the first frame at all, and that
 * hole is a visible stutter at the handover. It keeps exactly the size the
 * stage gave it and only its resting place is worked out here; until the tray
 * reports, that place is simply where the stage left it, so the first frame is
 * pixel-identical to the last one before it.
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
          (windowHeight - insetTop) / ROOM_ASPECT,
        )
      : from.width * from.scale;
  const roomHeight = roomWidth * ROOM_ASPECT;

  // Centred in what the tray leaves — but only when nothing handed over. A
  // handover is not a layout: the room is already on screen, at a place the
  // stage chose, and the only correct thing to do with it is leave it there.
  // Anything else is a jump at the exact moment the room should be the
  // steadiest thing in the flow, and the seal's tray is shorter than the
  // stage's sheet, so the space below it is space it already had.
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
