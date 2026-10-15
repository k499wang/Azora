import { padding, spacing } from '../../theme/spacing';

/** The picker options and the seal headline occupy the same space above their button. */
export function decorationPickerLayout(
  windowWidth: number,
  labelLineHeight: number,
  tileBorderWidth: number,
) {
  // Leave a sliver of the next choice visible to invite a swipe.
  const tileWidth = Math.min(112, (windowWidth - padding.screen.horizontal * 2) / 3.2);
  const wellSize = tileWidth - spacing.sm * 2;
  const labelHeight = labelLineHeight * 2;
  const rowHeight =
    wellSize + labelHeight + spacing.xs +
    (spacing.sm + tileBorderWidth) * 2 + spacing.xs * 2;

  return { tileWidth, wellSize, labelHeight, rowHeight };
}
