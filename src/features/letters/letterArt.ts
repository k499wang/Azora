import { colors } from '../../theme/colors';
import type { Poly } from '../room/RoomScene';
import type { Point } from '../room/decor/artKit';
import { poly, rounded } from '../room/decor/artKit';

const paper = colors.background.card;
const fold = colors.roomArt.paperFold;

export const ENVELOPE = { width: 320, height: 200, tip: [160, 100] as Point };

function envelopeBack(): Poly[] {
  const { width: w, height: h, tip } = ENVELOPE;
  const [cx, ty] = tip;
  return [
    poly([[0, 0], [w, 0], [w, h], [0, h]], fold),
    poly(rounded([[0, 0], [cx - 7, ty + 2], [0, h]], [0, 8, 0]), paper),
    poly(rounded([[w, 0], [w, h], [cx + 7, ty + 2]], [0, 0, 8]), paper),
    poly(rounded([[0, h], [cx, ty + 9], [w, h]], [0, 10, 0]), paper),
    poly(rounded([[0, 0], [w, 0], [cx, ty + 5]], [0, 0, 14]), fold),
    poly(rounded([[0, 0], [w, 0], tip], [0, 0, 14]), paper),
  ];
}

export const ENVELOPE_BACK: Poly[] = envelopeBack();

function heart([cx, cy]: Point, width: number, steps = 36): Point[] {
  const s = width / 32;
  return Array.from({ length: steps }, (_, i) => {
    const t = (Math.PI * 2 * i) / steps;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [cx + x * s, cy + (y - 2.5) * s];
  });
}

/** a wax disc whose edge swells in even lobes, measured from the top so it mirrors left to right */
function waxDisc([cx, cy]: Point, radius: number, lobes: number, swell: number, steps = 72): Point[] {
  return Array.from({ length: steps }, (_, i) => {
    const angle = (Math.PI * 2 * i) / steps;
    const r = radius * (1 + swell * Math.cos(angle * lobes));
    return [cx + Math.sin(angle) * r, cy - Math.cos(angle) * r];
  });
}

export const SEAL_CENTER: Point = [50, 50];

export const SEAL: Poly[] = [
  poly(waxDisc(SEAL_CENTER, 44, 12, 0.025), colors.playful.coral.base),
  poly(heart([50, 52], 30), paper),
];

export const SEAL_HALF_CLIPS = {
  left: [[-10, -10], [50, -10], [50, 110], [-10, 110]] as Point[],
  right: [[50, -10], [110, -10], [110, 110], [50, 110]] as Point[],
};
