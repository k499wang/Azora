import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = getMochiStageWidth(screenWidth, screenHeight);
  const blob = useRef<RoomBlobHandle>(null);
  const [placed, setPlaced] = useState(false);

  const onPlaced = useCallback(() => {
    setPlaced(true);
    blob.current?.cheer();
  }, []);

  // Keep the reveal mounted after it lands. Its final frame already is the
  // completed room; swapping in another full SVG at that moment only adds work
  // while Mochi starts cheering.
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
      title={`Finish your daily plan to decorate ${MASCOT_NAME}’s room.`}
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
        animateEntrance={false}
      >
        {reveal}
      </MochiStage>
    </OnboardingScreenLayout>
  );
}
