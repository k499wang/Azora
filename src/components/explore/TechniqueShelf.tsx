import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { TECHNIQUE_SHELF_CARD_WIDTH } from './TechniqueCard';
import { padding, spacing } from '../../theme/spacing';

interface Props {
  children: ReactNode;
  contentInset?: number;
}

/**
 * A horizontally scrolling row of technique cards, at every size.
 *
 * A tablet shows more of the row at once and keeps scrolling for the rest,
 * which is how a shelf is meant to work — the row is a browsing surface, not a
 * grid that happens to be cut off.
 *
 * Cards are built by the caller and passed as children: the two shelves differ
 * in which techniques they show and what analytics they attribute, and none of
 * that is this component's business.
 */
export default function TechniqueShelf({
  children,
  contentInset = padding.screen.horizontal,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={TECHNIQUE_SHELF_CARD_WIDTH + spacing.xs * 2}
      contentContainerStyle={{
        paddingHorizontal: contentInset - spacing.xs,
      }}
    >
      {children}
    </ScrollView>
  );
}

// The shelf runs full-bleed and insets itself, in both layouts. It must never
// assume a padded parent: its two callers disagree about that — Home pads the
// block around it, Explore pads only its header — and a negative margin tuned
// to one of them runs the other off the edge of the screen.
//
// Each card already carries a `spacing.xs` gutter, which is the gap between
// columns, so the provided inset takes that back to put the first card on the
// same line as the section header above it.
