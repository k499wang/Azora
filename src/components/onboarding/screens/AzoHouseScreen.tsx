import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import {
  DAYS,
  DECOR,
  HexRoom,
  ROOM_ASPECT,
  type Picks,
} from '../../../features/room/RoomScene';
import { ROOM_SHELLS, ROOM_STYLES } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import { useAzoStageWidth } from '../AzoStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { spacing } from '../../../theme/spacing';
import { duration, easing } from '../../../theme/motion';
import { useWhileVisible } from '../../../hooks/useWhileVisible';

/** rooms per floor, top floor first; the house is built from the ground up */
const FLOORS = [1, 2, 3] as const;
const ROOM_COUNT = FLOORS.reduce((sum, rooms) => sum + rooms, 0);
const BUILD_STEP_MS = 450;
const GAP = spacing.xs;
/** how many of a room's day slots come decorated */
const DECORATED_SLOTS = 3;
/** each slot draws from its lightest few options, so six rooms stay cheap */
const OPTIONS_PER_SLOT = 3;

/**
 * The lightest options for each slot, by how many shapes they draw.
 *
 * Six rooms render at once here, every shape its own native SVG node, and the
 * heaviest decorations draw several times the shapes of the lightest. At this
 * size the difference is invisible; on a low-end phone it is not.
 */
const LIGHT_OPTIONS = DAYS.map((day) =>
  [...day.options]
    .sort(
      (a, b) =>
        (DECOR[`${day.key}.${a.id}`]?.length ?? 0) -
        (DECOR[`${day.key}.${b.id}`]?.length ?? 0),
    )
    .slice(0, OPTIONS_PER_SLOT),
);

/**
 * A few decorations per room, different in each, so the house reads as lived
 * in without every room being the finished one from the screen before.
 */
function decorationsFor(room: number): Picks {
  const picks: Picks = {};
  DAYS.forEach((day, slot) => {
    if ((slot + room) % DAYS.length >= DECORATED_SLOTS) return;
    const options = LIGHT_OPTIONS[slot];
    picks[day.key] = options[(slot + room) % options.length].id;
  });
  return picks;
}

const ROOMS = Array.from({ length: ROOM_COUNT }, (_, index) => ({
  index,
  style: ROOM_STYLES[index % ROOM_STYLES.length],
  picks: decorationsFor(index),
  // Built bottom floor first, so the ground goes in before the roof.
  buildOrder: ROOM_COUNT - 1 - index,
}));

const FLOOR_ROOMS = FLOORS.map((rooms, floor) => {
  const firstIndex = FLOORS.slice(0, floor).reduce((sum, n) => sum + n, 0);
  return ROOMS.slice(firstIndex, firstIndex + rooms);
});

interface AzoHouseScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function AzoHouseScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AzoHouseScreenProps) {
  const stageWidth = useAzoStageWidth();
  const reducedMotion = useReducedMotion();
  const roomWidth = (stageWidth - GAP * (FLOORS.length - 1)) / FLOORS.length;
  const [built, setBuilt] = useState(reducedMotion ? ROOM_COUNT : 0);

  // One timeout per room rather than an interval, so the timer ends itself
  // once the house is up and nothing ticks while the screen sits idle.
  useWhileVisible(() => {
    if (built >= ROOM_COUNT) return () => {};
    const timer = setTimeout(() => setBuilt((n) => n + 1), BUILD_STEP_MS);
    return () => clearTimeout(timer);
  }, [built]);

  // The same elements every build step, so React skips the rooms already
  // standing instead of re-diffing their SVG trees each time one is added.
  const roomArt = useMemo(
    () =>
      ROOMS.map((room) => (
        <HexRoom
          key={room.index}
          width={roomWidth}
          picks={room.picks}
          shell={ROOM_SHELLS[room.style.shell]}
          frameHue={room.style.frameHue}
        />
      )),
    [roomWidth],
  );

  const entering = reducedMotion
    ? undefined
    : ZoomIn.duration(duration.slow).easing(easing.settle);

  return (
    <OnboardingScreenLayout
      title={`Try to build the biggest house for ${MASCOT_NAME}!`}
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={<OnboardingPrimaryButton label="Let's build" onPress={onContinue} />}
    >
      <View
        style={[styles.house, { width: stageWidth }]}
        accessible
        accessibilityLabel={`A house of ${ROOM_COUNT} rooms for ${MASCOT_NAME}`}
      >
        {FLOOR_ROOMS.map((rooms, floor) => (
          <View key={floor} style={styles.floor}>
            {rooms.map((room) => (
              <View
                key={room.index}
                style={{ width: roomWidth, height: roomWidth * ROOM_ASPECT }}
              >
                {room.buildOrder < built ? (
                  <Animated.View entering={entering}>
                    {roomArt[room.index]}
                  </Animated.View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  house: {
    alignSelf: 'center',
    gap: GAP,
  },
  floor: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: GAP,
  },
});
