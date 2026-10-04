const EDGE_WIDTH = 3.2;

/** Expand the object's silhouette behind its colour layers into a white sticker edge. */
export function stickerIllustrationSvg(body: string, opacity = 1): string {
  const edge = body
    .replace(/fill="(?!none")[^"]*"/g, 'fill="#FFFFFF"')
    .replace(/stroke="[^"]*"/g, 'stroke="#FFFFFF"')
    .replace(/stroke-width="([\d.]+)"/g, (_, width: string) =>
      `stroke-width="${Number(width) + EDGE_WIDTH}"`,
    );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 44 44"><g stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"><g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="${EDGE_WIDTH}">${edge}</g>${body}</g></svg>`;
}
