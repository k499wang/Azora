import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import RoomReplay from '../../../features/room/RoomReplay';
import type { RoomBlobHandle } from '../../../features/room/RoomBlob';
import type { Picks } from '../../../features/room/RoomScene';
import { ROOM_SHELLS } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import MochiStage, { getMochiStageWidth } from '../MochiStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface MochiFloorScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

/** one finished floor, for the fill-up */
const FINISHED_ROOM: Picks = {
  day1: 'checker_rug',
  day2: 'study_desk',
  day3: 'bookcase',
  day4: 'monstera',
  day5: 'gallery_wall',
  day6: 'day_window',
  day7: 'fairy_lights',
};

export default function MochiFloorScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: MochiFloorScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const width = getMochiStageWidth(screenWidth);
  const blob = useRef<RoomBlobHandle>(null);

  const [filled, setFilled] = useState(false);

  const onFilled = useCallback(() => {
    setFilled(true);
    blob.current?.cheer();
  }, []);

  // Seven decoration layers plus the room. Rebuilding that mid-fill is what
  // makes the fill stutter, so it is built once.
  const replay = useMemo(
    () => (
      <RoomReplay
        width={width}
        picks={FINISHED_ROOM}
        frameHue="sky"
        shell={ROOM_SHELLS.cream}
        onDone={onFilled}
      />
    ),
    [onFilled, width],
  );

  return (
    <OnboardingScreenLayout
      title="Seven things fill the room."
      subtitle="Then you start on his next one."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={<OnboardingPrimaryButton label="Got it" onPress={onContinue} />}
    >
      <MochiStage
        ref={blob}
        accessibilityLabel={`Say hello to ${MASCOT_NAME}`}
        onPress={() => blob.current?.cheer()}
        speech={filled ? 'home.' : undefined}

      >
        {replay}
      </MochiStage>
    </OnboardingScreenLayout>
  );
}
