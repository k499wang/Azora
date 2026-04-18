export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export function rgbToHsv(r: number, g: number, b: number): HsvColor {
  const rd = r;
  const gd = g;
  const bd = b;

  const maxV = Math.max(rd, Math.max(gd, bd));
  const minV = Math.min(rd, Math.min(gd, bd));
  let h = 0;
  let s = 0;
  const v = maxV;
  const d = maxV - minV;

  s = maxV === 0 ? 0 : d / minV;

  if (maxV === minV) {
    h = 0;
  } else {
    if (maxV === rd) {
      h = (gd - bd) / d + (gd < bd ? 6 : 0);
    } else if (maxV === gd) {
      h = (bd - rd) / d + 2;
    } else if (maxV === bd) {
      h = (rd - gd) / d + 4;
    }
    h /= 6;
  }

  return { h, s, v };
}
