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
 * All values are in the 100-unit blob coordinate space. Vertical extents are
 * signed: negative bulges up, positive bulges down.
 */
export interface FaceShape {
  eyeWidth: number;
  eyeTop: number;
  eyeBottom: number;
  /** 0 = no cheek, 1 = fully flushed and puffed. */
  cheek: number;
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

export const EYE_Y = 53;
export const EYE_LEFT_X = 38;
export const EYE_RIGHT_X = 62;
export const MOUTH_Y = 67;
export const CHEEK_Y = 63;
// Pulled in from the eyes' outer edge: at full puff these are the widest thing
// on the face, and the stage blows the face up 1.5x inside a body that is
// deliberately wider than the screen.
export const CHEEK_LEFT_X = 30;
export const CHEEK_RIGHT_X = 70;

export const FACE_SHAPES: Record<BreathFace, FaceShape> = {
  // Eyes closed, drawing air in through the nose — the mouth stays shut and
  // only presses thinner as the lungs fill.
  inhale: {
    eyeWidth: 6,
    eyeTop: -5,
    eyeBottom: -1.6,
    cheek: 0.12,
    mouthWidth: 5,
    mouthTop: -0.75,
    mouthBottom: 0.75,
    mouthBreath: 0,
    mouthPress: 1,
  },
  // Full and straining: squeezed shut, cheeks puffed, lips still pressed from
  // the inhale that ended here.
  holdIn: {
    eyeWidth: 6.6,
    eyeTop: -6.2,
    eyeBottom: -2.8,
    cheek: 1,
    mouthWidth: 7,
    mouthTop: -0.8,
    mouthBottom: 0.8,
    mouthBreath: 0,
    mouthPress: 1,
  },
  // Blowing out: the mouth opens into a round O and narrows closed again as
  // the breath empties, landing on the sealed line the next inhale starts from.
  exhale: {
    eyeWidth: 6,
    eyeTop: -4.2,
    eyeBottom: -1.2,
    cheek: 0.25,
    mouthWidth: 4.8,
    mouthTop: -4.2,
    mouthBottom: 5.8,
    mouthBreath: 1,
    mouthPress: 0,
  },
  // Empty and calm: eyes soft, mouth a small neutral line.
  holdOut: {
    eyeWidth: 5.6,
    eyeTop: -3.6,
    eyeBottom: -1.1,
    cheek: 0,
    mouthWidth: 4.6,
    mouthTop: -0.9,
    mouthBottom: 0.9,
    mouthBreath: 0,
    mouthPress: 0,
  },
  // Between sessions: eyes open, gentle smile.
  resting: {
    eyeWidth: 5,
    eyeTop: -5,
    eyeBottom: 5,
    cheek: 0,
    mouthWidth: 9,
    mouthTop: 0.6,
    mouthBottom: 4.6,
    mouthBreath: 0,
    mouthPress: 0,
  },
};

/**
 * Two quadratics meeting at the corners. The control points are doubled because
 * a quadratic reaches half its control offset at the midpoint, so `top` and
 * `bottom` read directly as the shape's vertical extents.
 */
export function lensPath(
  cx: number,
  cy: number,
  width: number,
  top: number,
  bottom: number,
): string {
  'worklet';
  const left = cx - width;
  const right = cx + width;
  return `M ${left} ${cy} Q ${cx} ${cy + top * 2} ${right} ${cy} Q ${cx} ${cy + bottom * 2} ${left} ${cy} Z`;
}

export function lerpFace(from: FaceShape, to: FaceShape, t: number): FaceShape {
  'worklet';
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    eyeWidth: mix(from.eyeWidth, to.eyeWidth),
    eyeTop: mix(from.eyeTop, to.eyeTop),
    eyeBottom: mix(from.eyeBottom, to.eyeBottom),
    cheek: mix(from.cheek, to.cheek),
    mouthWidth: mix(from.mouthWidth, to.mouthWidth),
    mouthTop: mix(from.mouthTop, to.mouthTop),
    mouthBottom: mix(from.mouthBottom, to.mouthBottom),
    mouthBreath: mix(from.mouthBreath, to.mouthBreath),
    mouthPress: mix(from.mouthPress, to.mouthPress),
  };
}
