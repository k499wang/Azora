import { useCallback, useMemo, useRef, useState } from 'react';
import RoomReplay from '../../../features/room/RoomReplay';
import type { AzoHandle } from '../../../features/mascot/AzoPortrait';
import type { Picks } from '../../../features/room/RoomScene';
import { ROOM_SHELLS } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import AzoStage, { useAzoStageWidth } from '../AzoStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface AzoFloorScreenProps {
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

export default function AzoFloorScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AzoFloorScreenProps) {
  const width = useAzoStageWidth();
  const azo = useRef<AzoHandle>(null);

  const [filled, setFilled] = useState(false);

  const onFilled = useCallback(() => {
    setFilled(true);
    azo.current?.cheer();
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
      title="You finish a room if you have seven decorations."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <AzoStage
        ref={azo}
        accessibilityLabel={`Say hello to ${MASCOT_NAME}`}
        onPress={() => azo.current?.cheer()}
        speech={filled ? 'home.' : undefined}
        animateEntrance={false}
      >
        {replay}
      </AzoStage>
    </OnboardingScreenLayout>
  );
}
