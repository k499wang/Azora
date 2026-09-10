export { eyePath, lensPath } from '../../../mascot/faceGeometry';

export type BreathFace = 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'resting';

/**
 * A face is a set of numbers, not a drawing.
 *
 * Every expression is built from the same three shapes — two eyes and a mouth,
 * each a closed path with an upper and a lower edge — so changing phase
 * interpolates geometry rather than cross-fading two pictures. The eye actually
 * closes; the mouth actually opens.
 *
 * The breath is nasal in and oral out, the way the sessions coach it: the mouth
 * is sealed for everything except the exhale, which is the one phase air leaves
 * through it.
 *
 * All values are in the koala's own coordinate space. Vertical extents are
 * signed: negative bulges up, positive bulges down.
 */
export interface FaceShape {
  eyeWidth: number;
  eyeTop: number;
  eyeBottom: number;
  /** 0 = the breathing-phase lens, 1 = a true resting ellipse. */
  eyeRoundness: number;
  mouthWidth: number;
  mouthTop: number;
  mouthBottom: number;
  /** How far the breath value opens this mouth. 0 keeps it sealed. */
  mouthBreath: number;
  /**
   * How far the breath value presses a sealed mouth thin and wide. This is the
   * only thing the mouth does while the air is going through the nose, and it
   * costs nothing — the mouth path is already redrawn on the breath.
   */
  mouthPress: number;
}

/**
 * Face anchors, in the coordinate space of `koalaPaths` — the same units the
 * head and ears are drawn in, so the face needs no scaling of its own.
 */
export const EYE_Y = 488;
export const EYE_LEFT_X = 396;
export const EYE_RIGHT_X = 684;
export const MOUTH_X = 540;
export const MOUTH_Y = 636;
/** Half the open eye, and the eyeball inside it. */
export const EYE_RADIUS = 67;
export const IRIS_RADIUS = 46;
/** How far the irises converge toward the nose. */
export const IRIS_INSET = 9;
export const HIGHLIGHT_RADIUS = 18;
export const HIGHLIGHT_UP = 26;
/** Toward the nose from the iris centre. */
export const HIGHLIGHT_IN = 18;
/** How far inside the lids the eyeball is held, so it never breaks the rim. */
export const IRIS_LID_INSET = 7;

export const FACE_SHAPES: Record<BreathFace, FaceShape> = {
  // Eyes closed, drawing air in through the nose — the mouth stays shut and
  // only presses thinner as the lungs fill.
  inhale: {
    eyeWidth: 70,
    eyeTop: -44,
    eyeBottom: -14,
    eyeRoundness: 0,
    mouthWidth: 55,
    mouthTop: -8,
    mouthBottom: 8,
    mouthBreath: 0,
    mouthPress: 1,
  },
  // Full and straining: squeezed shut, lips still pressed from the inhale
  // that ended here.
  holdIn: {
    eyeWidth: 73,
    eyeTop: -54,
    eyeBottom: -22,
    eyeRoundness: 0,
    mouthWidth: 77,
    mouthTop: -9,
    mouthBottom: 9,
    mouthBreath: 0,
    mouthPress: 1,
  },
  // Blowing out: the mouth opens into a round O and narrows closed again as
  // the breath empties, landing on the sealed line the next inhale starts from.
  //
  // It opens downward, the way a jaw does, and it opens small. A mouth that
  // widens as much as it drops ends up level with the nose and the same colour
  // as it, and the two read as one shape rather than a face blowing out.
  exhale: {
    eyeWidth: 66,
    eyeTop: -34,
    eyeBottom: -12,
    eyeRoundness: 0,
    mouthWidth: 44,
    mouthTop: -8,
    mouthBottom: 58,
    mouthBreath: 1,
    mouthPress: 0,
  },
  // Empty and calm: eyes soft, mouth a small neutral line.
  holdOut: {
    eyeWidth: 62,
    eyeTop: -30,
    eyeBottom: -11,
    eyeRoundness: 0,
    mouthWidth: 51,
    mouthTop: -10,
    mouthBottom: 10,
    mouthBreath: 0,
    mouthPress: 0,
  },
  // Between sessions: eyes wide open, gentle smile.
  resting: {
    eyeWidth: EYE_RADIUS,
    eyeTop: -EYE_RADIUS,
    eyeBottom: EYE_RADIUS,
    eyeRoundness: 1,
    mouthWidth: 55,
    mouthTop: 4,
    mouthBottom: 24,
    mouthBreath: 0,
    mouthPress: 0,
  },
};


/**
 * How far open a set of lids is, as a share of the resting eye. The lid ink and
 * the catchlight both key off this, so a squint drawn anywhere between two
 * phases still reads as one closing eye rather than two crossfading pictures.
 */
export function eyeOpenness(shape: FaceShape): number {
  'worklet';
  return (shape.eyeBottom - shape.eyeTop) / (EYE_RADIUS * 2);
}

export function lerpFace(from: FaceShape, to: FaceShape, t: number): FaceShape {
  'worklet';
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    eyeWidth: mix(from.eyeWidth, to.eyeWidth),
    eyeTop: mix(from.eyeTop, to.eyeTop),
    eyeBottom: mix(from.eyeBottom, to.eyeBottom),
    eyeRoundness: mix(from.eyeRoundness, to.eyeRoundness),
    mouthWidth: mix(from.mouthWidth, to.mouthWidth),
    mouthTop: mix(from.mouthTop, to.mouthTop),
    mouthBottom: mix(from.mouthBottom, to.mouthBottom),
    mouthBreath: mix(from.mouthBreath, to.mouthBreath),
    mouthPress: mix(from.mouthPress, to.mouthPress),
  };
}
