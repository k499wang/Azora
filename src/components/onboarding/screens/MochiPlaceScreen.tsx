import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { HexRoom } from '../../../features/room/RoomScene';
import PlacementReveal from '../../../features/room/PlacementReveal';
import type { RoomBlobHandle } from '../../../features/room/RoomBlob';
import { ROOM_SHELLS } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import MochiStage, { getMochiStageWidth } from '../MochiStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface MochiPlaceScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const FIRST_PIECE = 'checker_rug';

export default function MochiPlaceScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: MochiPlaceScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const width = getMochiStageWidth(screenWidth);
  const blob = useRef<RoomBlobHandle>(null);
  const [placed, setPlaced] = useState(false);

  const onPlaced = useCallback(() => {
    setPlaced(true);
    blob.current?.cheer();
  }, []);

  // Rebuilding either of these on a re-render would restart the drop, and the
  // room's SVG is expensive enough that it should be built once per state.
  const room = useMemo(
    () => (
      <HexRoom
        width={width}
        picks={{ day1: FIRST_PIECE }}
        shell={ROOM_SHELLS.cream}
        frameHue="sky"
      />
    ),
    [width],
  );

  const reveal = useMemo(
    () => (
      <PlacementReveal
        width={width}
        day="day1"
        option={FIRST_PIECE}
        picks={{}}
        frameHue="sky"
        shell={ROOM_SHELLS.cream}
        onDone={onPlaced}
      />
    ),
    [onPlaced, width],
  );

  return (
    <OnboardingScreenLayout
      title="Finish all three."
      subtitle="You put something in his room. One thing a day."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <MochiStage
        ref={blob}
        accessibilityLabel={`Say hello to ${MASCOT_NAME}`}
        onPress={() => blob.current?.cheer()}
        speech={placed ? 'thanks.' : undefined}

      >
        {placed ? room : reveal}
      </MochiStage>
    </OnboardingScreenLayout>
  );
}
