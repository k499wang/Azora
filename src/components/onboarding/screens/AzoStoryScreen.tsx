import { useEffect, useMemo, useRef } from 'react';
import { HexRoom } from '../../../features/room/RoomScene';
import { SPEECH_OPEN_MS } from '../../../features/room/RoomAzo';
import type { AzoHandle } from '../../../features/mascot/AzoPortrait';
import { ROOM_SHELLS } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import type { AzoStoryBeat } from '../data/azoStory';
import AzoStage, { useAzoStageWidth } from '../AzoStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface AzoStoryScreenProps {
  beat: AzoStoryBeat;
  /** both absent on the first beat, which opens the flow with no progress yet */
  stepIndex?: number;
  stepCount?: number;
  onContinue: () => void;
  /** absent on the first beat, which opens the flow */
  onBack?: () => void;
}

/**
 * Every story beat that is copy over the empty room. They differ only in what
 * they say, so they are one screen driven by `AZO_STORY` rather than five
 * files that drift apart.
 */
export default function AzoStoryScreen({
  beat,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AzoStoryScreenProps) {
  const width = useAzoStageWidth();
  const azo = useRef<AzoHandle>(null);

  const room = useMemo(
    () => <HexRoom width={width} shell={ROOM_SHELLS.cream} frameHue="sky" />,
    [width],
  );

  // The hop lands with the line, so the beat reads as one happy reaction rather
  // than a bubble and a bounce that happen to share a screen.
  useEffect(() => {
    if (!beat.cheer) return;
    const timer = setTimeout(() => azo.current?.cheer(), SPEECH_OPEN_MS);
    return () => clearTimeout(timer);
  }, [beat.cheer]);

  return (
    <OnboardingScreenLayout
      title={beat.title}
      progress={
        stepIndex === undefined || stepCount === undefined
          ? undefined
          : stepIndex / stepCount
      }
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={
        <OnboardingPrimaryButton label={beat.button} onPress={onContinue} />
      }
    >
      <AzoStage
        ref={azo}
        accessibilityLabel={`Say hello to ${MASCOT_NAME}`}
        onPress={() => azo.current?.cheer()}
        speech={beat.speech}
        sad={beat.sad}
      >
        {room}
      </AzoStage>
    </OnboardingScreenLayout>
  );
}
