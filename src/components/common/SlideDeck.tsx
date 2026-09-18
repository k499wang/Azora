import { Children } from 'react';
import type { ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { SlideDeck as Deck } from '../../hooks/useSlideDeck';

interface Props {
  deck: Deck;
  /** One child per page, in order. */
  children: ReactNode;
}

/**
 * The pages of a deck, laid end to end and moved as one.
 *
 * Only the page on screen is touchable or readable by a screen reader, and
 * neither is true mid-turn: the other pages are laid out beside this one the
 * whole time, and without this they are simply off the left and right edges
 * where a finger cannot reach them but a screen reader can.
 *
 * Each child keeps its own scrolling. Pages differ in how they want to be
 * laid out — centred, padded for a safe area — and that is the page's business.
 */
export default function SlideDeck({ deck, children }: Props) {
  return (
    <Animated.View
      style={[
        styles.strip,
        {
          width: deck.stripWidth,
          transform: [{ translateX: deck.translateX }],
        },
      ]}
    >
      {Children.map(children, (child, page) => {
        const live = !deck.isTransitioning && page === deck.index;
        return (
          <Animated.View
            pointerEvents={live ? 'auto' : 'none'}
            accessibilityElementsHidden={!live}
            importantForAccessibility={live ? 'auto' : 'no-hide-descendants'}
            style={{ width: deck.pageWidth }}
          >
            {child}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flex: 1,
    flexDirection: 'row',
  },
});
