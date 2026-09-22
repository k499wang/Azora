export type AzoStoryStep =
  | 'azoIntro'
  | 'azoMoved'
  | 'azoNewRoom'
  | 'azoBusy'
  | 'azoNoTime'
  | 'azoFresh'
  | 'azoDecorate'
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
 * opening five screens.
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
    title: 'Every move means a new room.',
    speech: 'empty.',
    sad: true,
    button: 'Continue',
  },
  azoBusy: {
    title: 'But life gets busy.',
    speech: 'always.',
    sad: true,
    button: 'Continue',
  },
  azoNoTime: {
    title: 'So his room stays unfinished.',
    speech: '...',
    sad: true,
    button: 'Continue',
  },
  azoFresh: {
    title: `Help ${MASCOT_NAME} decorate his room.`,
    speech: 'please.',
    cheer: true,
    button: 'Yes',
  },
  azoDecorate: {
    title: 'Finish your daily plan. Add one decoration.',
    speech: 'one a day.',
    cheer: true,
    button: 'Continue',
  },
  azoTogether: {
    title: 'We’ll help you build your day, too.',
    speech: 'together.',
    cheer: true,
    button: 'Let’s start',
  },
};
import { MASCOT_NAME } from '../../../features/room/mascot';
