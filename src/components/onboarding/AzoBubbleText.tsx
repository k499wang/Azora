import { useState } from 'react';
import { StyleSheet, type LayoutChangeEvent, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '../common/Text';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { splitEmphasis, type EmphasisPart } from './data/azoConversation';

interface AzoBubbleTextProps {
  text: string;
  style: StyleProp<TextStyle>;
  /** The widest the words may run: the room the chat leaves for a bubble. */
  maxWidth: number;
}

/** Spare height under the last line, taken back out of the bubble's bottom padding. */
const DRAW_SLACK = spacing.sm;

/**
 * A bubble's words, with `**emphasis**` set in semibold, wrapped by the platform.
 *
 * iOS draws a Text inside exactly the height it measured. With semibold runs
 * mixed in, the drawn lines can need a fraction more than that, so the last
 * line no longer fits: it is dropped, and the line above it is clipped mid-word
 * at the edge. Once laid out, the Text is given a little spare height to draw
 * into, pulled back by an equal negative margin so the bubble keeps its size.
 */
export default function AzoBubbleText({ text, style, maxWidth }: AzoBubbleTextProps) {
  const [drawRoom, setDrawRoom] = useState<{ text: string; maxWidth: number; minHeight: number }>();
  const minHeight = drawRoom?.text === text && drawRoom.maxWidth === maxWidth ? drawRoom.minHeight : undefined;

  const makeRoom = ({ nativeEvent }: LayoutChangeEvent) => {
    if (minHeight !== undefined) return;
    setDrawRoom({ text, maxWidth, minHeight: nativeEvent.layout.height + DRAW_SLACK });
  };

  return (
    <Text
      style={[style, { maxWidth }, minHeight !== undefined && { minHeight, marginBottom: -DRAW_SLACK }]}
      onLayout={makeRoom}
    >
      {renderParts(splitEmphasis(text))}
    </Text>
  );
}

function renderParts(parts: EmphasisPart[]) {
  return parts.map(({ text: part, emphasis }, index) =>
    emphasis ? <Text key={index} style={styles.emphasis}>{part}</Text> : part,
  );
}

const styles = StyleSheet.create({
  emphasis: { fontFamily: fonts.semibold },
});
