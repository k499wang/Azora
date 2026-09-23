import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { HexRoom, ROOM_ASPECT } from '../../../features/room/RoomScene';
import { ROOM_SHELLS, ROOM_STYLES } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import { useAzoStageWidth } from '../AzoStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { spacing } from '../../../theme/spacing';
import { duration, easing } from '../../../theme/motion';
import { useWhileVisible } from '../../../hooks/useWhileVisible';

/** top floor first; the house is built from the ground up */
const FLOORS = [1, 2, 3] as const;
const ROOM_COUNT = FLOORS.reduce((sum, rooms) => sum + rooms, 0);
const BUILD_STEP_MS = 450;
const GAP = spacing.xs;

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

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
    const timer = setInterval(() => {
      setBuilt((current) => {
        if (current >= ROOM_COUNT) clearInterval(timer);
        return Math.min(current + 1, ROOM_COUNT);
      });
    }, BUILD_STEP_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  let roomIndex = 0;
  const floors = FLOORS.map((rooms, floor) => {
    const firstIndex = roomIndex;
    roomIndex += rooms;
    return { floor, rooms, firstIndex };
  });

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
        {floors.map(({ floor, rooms, firstIndex }) => (
          <View key={floor} style={styles.floor}>
            {Array.from({ length: rooms }, (_, i) => {
              const index = firstIndex + i;
              // Built bottom floor first, so the ground goes in before the roof.
              const buildOrder = ROOM_COUNT - 1 - index;
              const style = ROOM_STYLES[index % ROOM_STYLES.length];
              return (
                <View
                  key={index}
                  style={{ width: roomWidth, height: roomWidth * ROOM_ASPECT }}
                >
                  {buildOrder < built ? (
                    <Animated.View
                      entering={
                        reducedMotion
                          ? undefined
                          : ZoomIn.duration(duration.slow).easing(easing.settle)
                      }
                    >
                      <HexRoom
                        width={roomWidth}
                        shell={ROOM_SHELLS[style.shell]}
                        frameHue={style.frameHue}
                      />
                    </Animated.View>
                  ) : null}
                </View>
              );
            })}
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
