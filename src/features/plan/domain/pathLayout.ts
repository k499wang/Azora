import { spacing } from '../../../theme/spacing';
import type { PlanCalendarDay, PlanCalendarWeek } from './planCalendar';
import { pathNodeOffset } from './planPath';
import type { TrailNode } from './pathTrail';

// Shared by the native rows and their trail geometry. Captions are absolute and
// do not affect these sizes, so the road needs only the path's width to draw.
export const DAY_NODE = spacing['6xl'];
export const TODAY_NODE = Math.round(DAY_NODE * 1.2);
export const ROOM_NODE = spacing['7xl'];
export const PATH_STEP = spacing['4xl'];
export const COIN_ASPECT = 1.15;
export const COIN_DEPTH = spacing.sm;
export const HEX_TALL = 2 / Math.sqrt(3);
export const RING_GAP = spacing.xs;
export const RING_WIDTH = spacing.sm;
export const RING_REACH = RING_GAP + RING_WIDTH;
export const HERE_ROOM = spacing.lg;
export const PATH_PADDING = spacing.sm;
export const ROOM_MARGIN = spacing.sm;

export function pathDaySize(day: PlanCalendarDay, locked: boolean): number {
  return !locked && (day.state === 'today' || day.state === 'doneToday') ? TODAY_NODE : DAY_NODE;
}

/** Coin centres and elliptical rims in the same fixed rows rendered by PlanPath. */
export function pathWeekTrailNodes(week: PlanCalendarWeek, locked: boolean, width: number): TrailNode[] {
  let top = PATH_PADDING;
  const nodes = week.days.map((day, index) => {
    const size = pathDaySize(day, locked);
    const ring = day.state === 'today' && !locked ? RING_REACH : 0;
    top += ring > 0 ? ring + HERE_ROOM : 0;
    const halfFace = size / COIN_ASPECT / 2;
    const node = {
      x: width / 2 + pathNodeOffset(index) * PATH_STEP,
      y: top + halfFace,
      reach: size / 2 + ring,
      above: halfFace + ring,
      below: halfFace + ring + COIN_DEPTH,
    };
    top += halfFace * 2 + COIN_DEPTH + ring + PATH_STEP;
    return node;
  });
  const halfRoomFace = ROOM_NODE * HEX_TALL / COIN_ASPECT / 2;
  nodes.push({
    x: width / 2,
    y: top + ROOM_MARGIN + halfRoomFace,
    reach: ROOM_NODE / 2,
    above: halfRoomFace,
    below: halfRoomFace + COIN_DEPTH,
  });
  return nodes;
}
