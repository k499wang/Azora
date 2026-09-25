export type AzoStoryStep =
  | 'azoIntro'
  | 'azoMoved'
  | 'azoNewRoom'
  | 'azoNotHome'
  | 'azoFresh'
  | 'azoTogether';

export interface AzoStoryBeat {
  title: string;
  /** a line for the blob to say; it opens on arrival and again on every poke */
  speech?: string;
  /** slumped and staying put, until the beat where someone offers to help */
  sad?: boolean;
  /** plays the delighted hop on arrival, in time with the line being said */
  cheer?: boolean;
  button: string;
}

/**
 * The story beats that are only copy over the empty room, in the order they are
 * told. Kept together so the arc can be read in one place and rewritten without
 * opening a screen per beat.
 *
 * See `docs/azo-story.md` for what the fiction may and may not claim.
 */
export const AZO_STORY: Record<AzoStoryStep, AzoStoryBeat> = {
  azoIntro: {
    title: `This is ${MASCOT_NAME}.`,
    speech: 'hi.',
    sad: true,
    button: 'Go on',
  },
  azoMoved: {
    title: `${MASCOT_NAME} moves houses a lot.`,
    speech: 'again.',
    sad: true,
    button: 'Continue',
  },
  azoNewRoom: {
    title: 'That means he never has time to decorate his room.',
    speech: 'no time.',
    sad: true,
    button: 'Continue',
  },
  azoNotHome: {
    title: 'So it never feels like home.',
    speech: 'not home.',
    sad: true,
    button: 'Continue',
  },
  azoFresh: {
    title: 'Could you decorate it for him?',
    speech: 'please.',
    cheer: true,
    button: 'I’ll help',
  },
  azoTogether: {
    title: 'First, let’s create your personalized plan.',
    speech: 'together.',
    cheer: true,
    button: 'Let’s start',
  },
};
import { MASCOT_NAME } from '../../../features/room/mascot';
