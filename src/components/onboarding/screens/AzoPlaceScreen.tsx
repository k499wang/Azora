import { useCallback, useMemo, useRef, useState } from 'react';
import PlacementReveal from '../../../features/room/PlacementReveal';
import type { AzoHandle } from '../../../features/mascot/AzoPortrait';
import { ROOM_SHELLS } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import AzoStage, { useAzoStageWidth } from '../AzoStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface AzoPlaceScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const FIRST_PIECE = 'checker_rug';

export default function AzoPlaceScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AzoPlaceScreenProps) {
  const width = useAzoStageWidth();
  const azo = useRef<AzoHandle>(null);
  const [placed, setPlaced] = useState(false);

  const onPlaced = useCallback(() => {
    setPlaced(true);
    azo.current?.cheer();
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
      <AzoStage
        ref={azo}
        accessibilityLabel={`Say hello to ${MASCOT_NAME}`}
        onPress={() => azo.current?.cheer()}
        speech={placed ? 'thanks.' : undefined}
        animateEntrance={false}
      >
        {reveal}
      </AzoStage>
    </OnboardingScreenLayout>
  );
}
