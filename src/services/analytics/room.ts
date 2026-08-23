import { posthog } from '../../config/posthog';
import { AnalyticsEvent } from './events';
import type { RoomSlot } from '../../lib/room/roomProgress';

/**
 * The room loop, as a funnel: a piece is earned, the picker is opened, the
 * piece is placed, the room fills, the next one opens.
 *
 * `is_pro` is resolved from canonical entitlement before each event. It is
 * `null` only when that lookup fails, never a guess that an unknown user is
 * non-Pro.
 *
 * `floor` and `placed_count` are the two coordinates of progress — which room
 * of the hotel, and how far into it — so a drop-off can be read as "loses
 * interest mid-room" or "never opens a second room", which are different
 * problems with different fixes.
 */

interface RoomEventProps {
  isPro: boolean | null;
  /** position in the hotel; 1 is the ground floor */
  floor: number;
}

export function trackRoomRewardUnlocked(
  props: RoomEventProps & {
    slot: RoomSlot | null;
    placedCount: number;
  },
) {
  posthog.capture(AnalyticsEvent.RoomRewardUnlocked, {
    is_pro: props.isPro,
    floor: props.floor,
    slot: props.slot,
    placed_count: props.placedCount,
  });
}

export function trackRoomPickerOpened(
  props: RoomEventProps & {
    slot: RoomSlot;
    placedCount: number;
  },
) {
  posthog.capture(AnalyticsEvent.RoomPickerOpened, {
    is_pro: props.isPro,
    floor: props.floor,
    slot: props.slot,
    placed_count: props.placedCount,
  });
}

export function trackRoomDecorationPlaced(
  props: RoomEventProps & {
    slot: RoomSlot;
    optionId: string;
    /** pieces in the room *after* this one, 1..7 */
    placedCount: number;
    completesRoom: boolean;
  },
) {
  posthog.capture(AnalyticsEvent.RoomDecorationPlaced, {
    is_pro: props.isPro,
    floor: props.floor,
    slot: props.slot,
    option_id: props.optionId,
    placed_count: props.placedCount,
    completes_room: props.completesRoom,
  });
}

/**
 * Derivable from `room_decoration_placed` with `placed_count = 7`, and emitted
 * anyway: a funnel step that has to be expressed as a property filter is a
 * funnel step nobody builds.
 */
export function trackRoomCompleted(props: RoomEventProps) {
  posthog.capture(AnalyticsEvent.RoomCompleted, {
    is_pro: props.isPro,
    floor: props.floor,
  });
}

export function trackRoomStarted(
  props: RoomEventProps & {
    shell: string;
    frameHue: string;
  },
) {
  posthog.capture(AnalyticsEvent.RoomStarted, {
    is_pro: props.isPro,
    floor: props.floor,
    shell: props.shell,
    frame_hue: props.frameHue,
  });
}
