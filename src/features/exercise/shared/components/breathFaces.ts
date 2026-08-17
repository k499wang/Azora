export type BreathFace = 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'resting';

/**
 * A face is a set of numbers, not a drawing.
 *
 * Every expression is built from the same three shapes — two eyes and a mouth,
 * each a closed path with an upper and a lower edge — so changing phase
 * interpolates geometry rather than cross-fading two pictures. The eye actually
 * closes; the mouth actually opens.
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
  /** How far the breath value opens this mouth. 0 holds it still. */
  mouthBreath: number;
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
  // Eyes closed, drawing air in through a mouth that widens as the breath
  // fills.
  inhale: {
    eyeWidth: 6,
    eyeTop: -5,
    eyeBottom: -1.6,
    cheek: 0.15,
    mouthWidth: 4.6,
    mouthTop: -4.6,
    mouthBottom: 4.6,
    mouthBreath: 1,
  },
  // Full and straining: squeezed shut, cheeks puffed, mouth sealed.
  holdIn: {
    eyeWidth: 6.6,
    eyeTop: -6.2,
    eyeBottom: -2.8,
    cheek: 1,
    mouthWidth: 7,
    mouthTop: -0.8,
    mouthBottom: 0.8,
    mouthBreath: 0,
  },
  // Blowing out: the mouth pushes open and wide, then relaxes closed as the
  // breath empties.
  exhale: {
    eyeWidth: 6,
    eyeTop: -4.2,
    eyeBottom: -1.2,
    cheek: 0.3,
    mouthWidth: 7,
    mouthTop: -3.4,
    mouthBottom: 8.4,
    mouthBreath: 1,
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
  };
}
