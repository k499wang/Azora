import { MASCOT_NAME } from '../../../features/room/mascot';

export type MochiStoryStep =
  | 'mochiIntro'
  | 'mochiMoved'
  | 'mochiNoTime'
  | 'mochiFresh';

export interface MochiStoryBeat {
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
 * See `docs/mochi-story.md` for what the fiction may and may not claim.
 */
export const MOCHI_STORY: Record<MochiStoryStep, MochiStoryBeat> = {
  mochiIntro: {
    title: `This is ${MASCOT_NAME}.`,
    speech: 'hi.',
    sad: true,
    button: 'Go on',
  },
  mochiMoved: {
    title: `${MASCOT_NAME} moves houses a lot.`,
    speech: 'again.',
    sad: true,
    button: 'Continue',
  },
  mochiNoTime: {
    title: `${MASCOT_NAME} never has time to decorate his room.`,
    speech: '...',
    sad: true,
    button: 'Continue',
  },
  mochiFresh: {
    title: `Would you help decorate ${MASCOT_NAME}’s room?`,
    speech: 'please.',
    cheer: true,
    button: 'Yes!',
  },
};
