import { EYE_RADIUS } from './azoPaths';

/**
 * How Azo is feeling.
 *
 * One character with nine expressions reads as someone, where nine differently
 * drawn mascots read as nine of them — so his silhouette never changes. What
 * changes is the aperture of his lids, where he is looking, and his mouth.
 */
export type AzoExpression =
  | 'happy'
  | 'curious'
  | 'listening'
  | 'sad'
  | 'sleepy'
  | 'excited'
  | 'thinking'
  | 'surprised'
  | 'proud'
  | 'puffed'
  | 'pleased';

/**
 * A face is numbers, in the artwork's own units.
 *
 * Vertical extents are signed offsets from the anchor in `azoPaths`: negative
 * bulges up, positive bulges down. That is what lets a blink, a poke and an
 * expression all be the same interpolation instead of three mechanisms.
 */
export interface AzoFace {
  /** half the eye's width */
  eyeWidth: number;
  eyeTop: number;
  eyeBottom: number;
  /** 0 = a pointed lens, 1 = a true ellipse */
  eyeRoundness: number;
  /**
   * Degrees the outer corner of each lid drops. This is the one thing the
   * artwork cannot say any other way: Azo has no brows, so the tilt of the lids
   * is carrying everything a brow would. Held per expression rather than
   * interpolated, since a blink should not straighten a sad eye.
   */
  eyeDroop: number;
  /** where he is looking, from the resting gaze */
  irisUp: number;
  /** positive looks toward the sprite's own left, which is screen right */
  irisSide: number;
  /** half the mouth's width */
  mouthWidth: number;
  mouthTop: number;
  mouthBottom: number;
}

export const FACES: Record<AzoExpression, AzoFace> = {
  // Wide open and smiling. The resting face, and the one everything else is
  // read against.
  happy: {
    eyeWidth: EYE_RADIUS,
    eyeTop: -60,
    eyeBottom: 60,
    eyeRoundness: 1,
    eyeDroop: 0,
    irisUp: 0,
    irisSide: 0,
    mouthWidth: 52,
    mouthTop: 2,
    mouthBottom: 30,
  },
  // Attending to what he just asked: eyes level, gaze carried a little toward
  // his own speech bubble, mouth left small and open on the question. One of
  // the two listening faces — they differ only in where he is looking and how
  // far the lids are down, which is as much as a face should move on a screen
  // whose answer he has not been given yet.
  curious: {
    eyeWidth: 54,
    eyeTop: -58,
    eyeBottom: 56,
    eyeRoundness: 1,
    eyeDroop: -2,
    irisUp: -5,
    irisSide: 12,
    mouthWidth: 40,
    mouthTop: 0,
    mouthBottom: 26,
  },
  // The other listening face: lids a shade lower and the gaze dropped toward
  // the options, so he is waiting on the answer rather than asking again.
  listening: {
    eyeWidth: 53,
    eyeTop: -46,
    eyeBottom: 44,
    eyeRoundness: 0.85,
    eyeDroop: 1,
    irisUp: 8,
    irisSide: -6,
    mouthWidth: 44,
    mouthTop: 4,
    mouthBottom: 20,
  },
  // Softened rather than narrowed: lids down a little, smile smaller. This is
  // the face for a screen that has just told him something good.
  pleased: {
    eyeWidth: 52,
    eyeTop: -36,
    eyeBottom: 26,
    eyeRoundness: 0.7,
    eyeDroop: -3,
    irisUp: 0,
    irisSide: 0,
    mouthWidth: 46,
    mouthTop: 4,
    mouthBottom: 24,
  },
  // Everything open at once, which is the only difference between delight and
  // alarm on a face with no brows — the mouth decides which.
  excited: {
    eyeWidth: 60,
    eyeTop: -68,
    eyeBottom: 62,
    eyeRoundness: 1,
    eyeDroop: -4,
    irisUp: -6,
    irisSide: 0,
    mouthWidth: 58,
    mouthTop: -14,
    mouthBottom: 46,
  },
  // Lids down to happy arcs, chest already doing the rest of the work.
  proud: {
    eyeWidth: 54,
    eyeTop: -30,
    eyeBottom: 12,
    eyeRoundness: 0.35,
    eyeDroop: -8,
    irisUp: 0,
    irisSide: 0,
    mouthWidth: 50,
    mouthTop: 0,
    mouthBottom: 26,
  },
  // Wide eyes and a small round mouth. The mouth is what keeps this from
  // reading as `excited`.
  surprised: {
    eyeWidth: 62,
    eyeTop: -70,
    eyeBottom: 70,
    eyeRoundness: 1,
    eyeDroop: 0,
    irisUp: 0,
    irisSide: 0,
    mouthWidth: 26,
    mouthTop: -22,
    mouthBottom: 24,
  },
  // Looking up and away, which is the whole of the expression. He is used on
  // the screens that ask a question, so his gaze goes where the answer is
  // rather than at the reader.
  thinking: {
    eyeWidth: 52,
    eyeTop: -26,
    eyeBottom: 34,
    eyeRoundness: 0.55,
    eyeDroop: 2,
    irisUp: -14,
    irisSide: 18,
    mouthWidth: 30,
    mouthTop: -5,
    mouthBottom: 7,
  },
  // Nearly shut, lids heavy at the outer corner.
  sleepy: {
    eyeWidth: 50,
    eyeTop: 2,
    eyeBottom: 20,
    eyeRoundness: 0.15,
    eyeDroop: 6,
    irisUp: 4,
    irisSide: 0,
    mouthWidth: 28,
    mouthTop: -6,
    mouthBottom: 12,
  },
  // A frown is the mouth bulging upward: both extents sit above the anchor, so
  // the same lens that smiles everywhere else turns over here.
  sad: {
    eyeWidth: 50,
    eyeTop: -40,
    eyeBottom: 42,
    eyeRoundness: 0.9,
    eyeDroop: 12,
    irisUp: 10,
    irisSide: 0,
    mouthWidth: 44,
    mouthTop: -22,
    mouthBottom: -2,
  },
  // Holding his breath: eyes squeezed, lips pressed thin and wide.
  puffed: {
    eyeWidth: 48,
    eyeTop: -14,
    eyeBottom: 12,
    eyeRoundness: 0.2,
    eyeDroop: 0,
    irisUp: 0,
    irisSide: 0,
    mouthWidth: 60,
    mouthTop: -6,
    mouthBottom: 6,
  },
};

/**
 * A shut eye, and the face a poke puts him in.
 *
 * The blink is the resting face driven to `SHUT`, so a squint blinks from
 * wherever it already is rather than snapping open first. `POKED` is `excited`
 * without its lid tilt, which is what lets a sad Azo brighten without his lids
 * straightening out from under him.
 */
export const SHUT: Pick<
  AzoFace,
  'eyeTop' | 'eyeBottom' | 'eyeRoundness' | 'eyeWidth'
> = {
  eyeWidth: 52,
  eyeTop: 4,
  eyeBottom: 11,
  eyeRoundness: 0,
};

/**
 * Delight, drawn rather than performed.
 *
 * The lids close most of the way into an upward arc, which the lid ink then
 * fills — a happy squint, not a wide stare. This is the whole of the poke
 * reaction that the body used to carry, and it can carry it because a face here
 * is rebuilt from geometry rather than transformed: nothing about it can read as
 * a warped picture.
 */
export const POKED: AzoFace = {
  eyeWidth: 58,
  eyeTop: -34,
  eyeBottom: 4,
  eyeRoundness: 0.15,
  eyeDroop: -9,
  irisUp: 0,
  irisSide: 0,
  mouthWidth: 62,
  mouthTop: 0,
  mouthBottom: 42,
};

export function lerpFace(from: AzoFace, to: AzoFace, t: number): AzoFace {
  'worklet';
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    eyeWidth: mix(from.eyeWidth, to.eyeWidth),
    eyeTop: mix(from.eyeTop, to.eyeTop),
    eyeBottom: mix(from.eyeBottom, to.eyeBottom),
    eyeRoundness: mix(from.eyeRoundness, to.eyeRoundness),
    eyeDroop: mix(from.eyeDroop, to.eyeDroop),
    irisUp: mix(from.irisUp, to.irisUp),
    irisSide: mix(from.irisSide, to.irisSide),
    mouthWidth: mix(from.mouthWidth, to.mouthWidth),
    mouthTop: mix(from.mouthTop, to.mouthTop),
    mouthBottom: mix(from.mouthBottom, to.mouthBottom),
  };
}

/** The blink, which touches the aperture and nothing else. */
export function blinkFace(face: AzoFace, blink: number): AzoFace {
  'worklet';
  const mix = (a: number, b: number) => a + (b - a) * blink;
  return {
    ...face,
    eyeWidth: mix(face.eyeWidth, SHUT.eyeWidth),
    eyeTop: mix(face.eyeTop, SHUT.eyeTop),
    eyeBottom: mix(face.eyeBottom, SHUT.eyeBottom),
    eyeRoundness: mix(face.eyeRoundness, SHUT.eyeRoundness),
  };
}

/** How far open a set of lids is, as a share of the resting eye. */
export function eyeOpenness(face: AzoFace): number {
  'worklet';
  return (face.eyeBottom - face.eyeTop) / (EYE_RADIUS * 2);
}
