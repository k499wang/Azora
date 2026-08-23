import { MASCOT_NAME } from '../../../features/room/mascot';

export type MochiStoryStep =
  | 'mochiIntro'
  | 'mochiMoved'
  | 'mochiUnpacked'
  | 'mochiFresh';

export interface MochiStoryBeat {
  title: string;
  subtitle: string;
  /** a line for the blob to say; it opens on arrival and again on every poke */
  speech?: string;
  /** slumped and staying put, until the beat where someone offers to help */
  sad?: boolean;
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
    subtitle: 'He just moved in.',
    speech: 'hi.',
    sad: true,
    button: 'Go on',
  },
  mochiMoved: {
    title: "He's moved a lot.",
    subtitle: 'Never long enough to unpack.',
    speech: 'again.',
    sad: true,
    button: 'Continue',
  },
  mochiUnpacked: {
    title: 'So his room is empty.',
    subtitle: 'He stopped bothering to decorate it.',
    speech: '...',
    sad: true,
    button: 'Continue',
  },
  mochiFresh: {
    title: 'You decorate it for him.',
    subtitle: 'First he needs to know what you are working on.',
    speech: 'so?',
    button: 'Continue',
  },
};
