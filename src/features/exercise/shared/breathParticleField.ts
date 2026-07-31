/**
 * Layout for the ambient particle field.
 *
 * Every mote belongs to the breath: it sits on a ray from the circle's center
 * and is pushed out or drawn in by the envelope. The only motion it owns is a
 * slow orbit around that center, so nothing ever drifts in a direction the
 * breath did not choose. A field with its own gravity and wind reads as weather
 * and pulls attention off the circle.
 */

export interface BreathParticle {
  /** Starting angle in radians. */
  angle: number;
  /** Distance from center at a neutral breath, in px. */
  radius: number;
  /** Sprite scale factor. */
  scale: number;
  /** Radians per second of orbit; signed so the field counter-rotates. */
  orbitSpeed: number;
  /** Baked per-mote alpha, so a uniform field still reads as having depth. */
  alpha: number;
}

export interface BreathParticleFieldOptions {
  count: number;
  innerRadius: number;
  outerRadius: number;
  minSize: number;
  maxSize: number;
  spriteSize: number;
  seed?: number;
}

const MIN_ORBIT_SPEED = 0.03;
const MAX_ORBIT_SPEED = 0.12;
const MIN_ALPHA = 0.35;

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createBreathParticleField({
  count,
  innerRadius,
  outerRadius,
  minSize,
  maxSize,
  spriteSize,
  seed = 11,
}: BreathParticleFieldOptions): BreathParticle[] {
  const random = createRandom(seed);
  const span = Math.max(0, outerRadius - innerRadius);

  return Array.from({ length: count }, () => {
    // sqrt keeps the field evenly dense by area instead of bunching at the
    // center, where the breathing circle already sits.
    const radius = innerRadius + span * Math.sqrt(random());
    const size = minSize + (maxSize - minSize) * random();
    const speed =
      MIN_ORBIT_SPEED + (MAX_ORBIT_SPEED - MIN_ORBIT_SPEED) * random();

    return {
      angle: random() * Math.PI * 2,
      radius,
      scale: size / spriteSize,
      orbitSpeed: random() < 0.5 ? -speed : speed,
      alpha: MIN_ALPHA + (1 - MIN_ALPHA) * random(),
    };
  });
}
