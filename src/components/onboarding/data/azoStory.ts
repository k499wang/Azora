export type AzoStoryStep =
  | 'azoIntro'
  | 'azoMoved'
  | 'azoNewRoom'
  | 'azoBusy'
  | 'azoFresh'
  | 'azoPlan';

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
    title: 'He just moved into a new house.',
    speech: 'again.',
    sad: true,
    button: 'Continue',
  },
  azoNewRoom: {
    title: 'His room is completely empty.',
    speech: 'empty.',
    sad: true,
    button: 'Continue',
  },
  azoBusy: {
    title: 'He’s been too busy to unpack.',
    speech: 'busy.',
    sad: true,
    button: 'Continue',
  },
  azoFresh: {
    title: 'Do you want to help him decorate his house?',
    speech: 'please.',
    cheer: true,
    button: 'I’ll help',
  },
  azoPlan: {
    title: `Finish your daily plan to decorate ${MASCOT_NAME}’s room.`,
    speech: 'thanks.',
    cheer: true,
    button: 'Let’s start',
  },
};
import { MASCOT_NAME } from '../../../features/room/mascot';
