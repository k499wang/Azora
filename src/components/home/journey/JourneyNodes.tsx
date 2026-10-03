import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from '../../common/icons/Icon';
import { RoomPieceRow, type RoomPieceState } from '../TodaysDailiesSection';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import {
  TODAY_JOURNEY_COLUMN_WIDTH,
  TODAY_JOURNEY_MARKER_ICON_SIZE,
  TODAY_JOURNEY_MARKER_SIZE,
} from '../todayJourneyLayout';

const RING_WIDTH = 2;

interface JourneyRowMarkerProps {
  completed: boolean;
  locked: boolean;
}

function CompletedJourneyBadge() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32">
      <Path
        d="M16 2 C19 2 19.5 4.5 22 5 C25 5.5 26.5 7 27 10 C27.5 12.5 30 13 30 16 C30 19 27.5 19.5 27 22 C26.5 25 25 26.5 22 27 C19.5 27.5 19 30 16 30 C13 30 12.5 27.5 10 27 C7 26.5 5.5 25 5 22 C4.5 19.5 2 19 2 16 C2 13 4.5 12.5 5 10 C5.5 7 7 5.5 10 5 C12.5 4.5 13 2 16 2 Z"
        fill={colors.playful.sky.base}
        stroke={colors.text.inverse}
        strokeWidth={2}
      />
      <Path
        d="M10.5 16 L14 19.5 L21.5 12"
        fill="none"
        stroke={colors.text.inverse}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A plan row's stop on the rail, sized to sit in the column beside it. */
export function JourneyRowMarker({ completed, locked }: JourneyRowMarkerProps) {
  return (
    <View style={styles.column} pointerEvents="none">
      {completed ? (
        <CompletedJourneyBadge />
      ) : (
        <View style={[styles.marker, locked ? styles.markerLocked : styles.markerIdle]}>
          {locked ? (
            <Icon name="lock" size={TODAY_JOURNEY_MARKER_ICON_SIZE - 2} color={colors.text.tertiary} />
          ) : null}
        </View>
      )}
    </View>
  );
}

/**
 * The foot of the plan: the room piece's own stop on the rail, beside the card
 * that says where the piece is up to. Not a row — it cannot be moved.
 */
export function JourneyDestinationNode({ state, target }: {
  state: RoomPieceState;
  target?: { ref: Ref<View>; collapsable: false };
}) {
  const open = state.kind === 'claim' || state.kind === 'newRoom';
  const placed = state.kind === 'placed';
  return (
    <View style={styles.destinationRow} {...target}>
      <View style={styles.column} pointerEvents="none">
        {placed ? (
          <CompletedJourneyBadge />
        ) : (
          <View style={[styles.marker, open ? styles.markerDone : styles.markerIdle]}>
            <Icon
              name="room-hex"
              size={TODAY_JOURNEY_MARKER_ICON_SIZE}
              color={open ? colors.text.inverse : colors.text.tertiary}
            />
          </View>
        )}
      </View>
      <RoomPieceRow state={state} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: TODAY_JOURNEY_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: TODAY_JOURNEY_MARKER_SIZE,
    height: TODAY_JOURNEY_MARKER_SIZE,
    borderRadius: TODAY_JOURNEY_MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIdle: {
    backgroundColor: colors.background.card,
    borderWidth: RING_WIDTH,
    borderColor: colors.border.default,
  },
  // A row the free plan has run out of keeps its place on the rail, but the
  // marker says why it will not open.
  markerLocked: {
    backgroundColor: colors.background.secondary,
    borderWidth: RING_WIDTH,
    borderColor: colors.border.default,
  },
  markerDone: {
    backgroundColor: colors.playful.sky.base,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
});
