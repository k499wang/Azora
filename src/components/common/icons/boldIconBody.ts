/** Give answer and task illustrations solid color and rounded, readable strokes. */
export function boldIconBody(body: string): string {
  return body
    .replace(/opacity="(?:\.5|0\.5)"/g, 'opacity=".75"')
    .replace(/stroke-width="([\d.]+)"/g, (_, width: string) =>
      `stroke-width="${Math.max(Number(width), 2.4)}"`,
    );
}
