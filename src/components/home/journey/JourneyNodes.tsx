import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
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

/** A plan row's stop on the rail, sized to sit in the column beside it. */
export function JourneyRowMarker({ completed, locked }: JourneyRowMarkerProps) {
  return (
    <View style={styles.column} pointerEvents="none">
      <View
        style={[
          styles.marker,
          completed
            ? styles.markerDone
            : locked
              ? styles.markerLocked
              : styles.markerIdle,
        ]}
      >
        {completed ? (
          <Icon name="check" size={TODAY_JOURNEY_MARKER_ICON_SIZE} color={colors.text.inverse} />
        ) : locked ? (
          <Icon name="lock" size={TODAY_JOURNEY_MARKER_ICON_SIZE - 2} color={colors.text.tertiary} />
        ) : null}
      </View>
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
        <View
          style={[
            styles.marker,
            placed || open ? styles.markerDone : styles.markerIdle,
          ]}
        >
          <Icon
            name={placed ? 'check' : 'room-hex'}
            size={TODAY_JOURNEY_MARKER_ICON_SIZE}
            color={placed || open ? colors.text.inverse : colors.text.tertiary}
          />
        </View>
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
