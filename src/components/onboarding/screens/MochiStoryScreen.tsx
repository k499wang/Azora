import { useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { HexRoom } from '../../../features/room/RoomScene';
import {
  SPEECH_OPEN_MS,
  type RoomBlobHandle,
} from '../../../features/room/RoomBlob';
import { ROOM_SHELLS } from '../../../features/room/roomShells';
import { MASCOT_NAME } from '../../../features/room/mascot';
import type { MochiStoryBeat } from '../data/mochiStory';
import MochiStage, { getMochiStageWidth } from '../MochiStage';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface MochiStoryScreenProps {
  beat: MochiStoryBeat;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  /** absent on the first beat, which opens the flow */
  onBack?: () => void;
}

/**
 * Every story beat that is copy over the empty room. They differ only in what
 * they say, so they are one screen driven by `MOCHI_STORY` rather than five
 * files that drift apart.
 */
export default function MochiStoryScreen({
  beat,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: MochiStoryScreenProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = getMochiStageWidth(screenWidth, screenHeight);
  const blob = useRef<RoomBlobHandle>(null);

  const room = useMemo(
    () => <HexRoom width={width} shell={ROOM_SHELLS.cream} frameHue="sky" />,
    [width],
  );

  // The hop lands with the line, so the beat reads as one happy reaction rather
  // than a bubble and a bounce that happen to share a screen.
  useEffect(() => {
    if (!beat.cheer) return;
    const timer = setTimeout(() => blob.current?.cheer(), SPEECH_OPEN_MS);
    return () => clearTimeout(timer);
  }, [beat.cheer]);

  return (
    <OnboardingScreenLayout
      title={beat.title}
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      typeTitle
      centerBody
      centerOnScreen
      footer={
        <OnboardingPrimaryButton label={beat.button} onPress={onContinue} />
      }
    >
      <MochiStage
        ref={blob}
        accessibilityLabel={`Say hello to ${MASCOT_NAME}`}
        onPress={() => blob.current?.cheer()}
        speech={beat.speech}
        sad={beat.sad}
      >
        {room}
      </MochiStage>
    </OnboardingScreenLayout>
  );
}
