import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import AzoPortrait from '../../features/mascot/AzoPortrait';
import { AZO_ASPECT, FEET_Y, STAGE_HEIGHT, STAGE_Y } from '../../features/mascot/azoPaths';
import { colors } from '../../theme/colors';

/**
 * Azo in his glasses on a stack of books, in front of a chalkboard. A board
 * draws its own content as `children`, laid out in the same box as the scene,
 * where every coordinate is a fraction of the scene width so the drawing
 * scales as one piece.
 *
 * Azo stands over the lower right of the slate: right of 0.6, content has
 * to end above 0.4 or his ears cover it.
 */

const FRAME = 0.03;
const BOARD_RADIUS = 0.035;
const BOARD_HEIGHT = 0.6;
const SLATE_INSET = 0.025;
const BOARD_X = 0.025;
const LEDGE_Y = BOARD_HEIGHT - 0.025;
const LEDGE_HEIGHT = 0.05;

const AZO_SIZE = 0.44;
const BOOK_HEIGHT = 0.042;
const BOOK_CENTER_X = 0.78;
const BOOKS = [
  { width: 0.34, shift: 0, cover: colors.chalkboard.bookGreen },
  { width: 0.3, shift: -0.015, cover: colors.chalkboard.bookOrange },
  { width: 0.32, shift: 0.012, cover: colors.chalkboard.bookBlue },
];

export const CHALKBOARD_SCENE_HEIGHT = 0.95;
/** the middle of the slate, for content that should sit centred on the board */
export const CHALKBOARD_CENTER = { x: 0.5, y: BOARD_HEIGHT / 2 };

interface ChalkboardSceneProps {
  width: number;
  active?: boolean;
  children: ReactNode;
}

export default function ChalkboardScene({ width, active = true, children }: ChalkboardSceneProps) {
  const w = (fraction: number) => fraction * width;
  const height = w(CHALKBOARD_SCENE_HEIGHT);
  const azoWidth = w(AZO_SIZE);
  const azoHeight = azoWidth * AZO_ASPECT;
  const feetFromTop = ((FEET_Y - STAGE_Y) / STAGE_HEIGHT) * azoHeight;
  const booksTop = height - w(BOOK_HEIGHT) * BOOKS.length;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect
          x={w(BOARD_X)}
          y={0}
          width={w(1 - BOARD_X * 2)}
          height={w(BOARD_HEIGHT)}
          rx={w(BOARD_RADIUS)}
          fill={colors.chalkboard.frame}
        />
        <Rect
          x={w(BOARD_X + FRAME)}
          y={w(FRAME)}
          width={w(1 - (BOARD_X + FRAME) * 2)}
          height={w(BOARD_HEIGHT - FRAME * 2)}
          rx={w(BOARD_RADIUS - SLATE_INSET / 2)}
          fill={colors.chalkboard.slate}
        />
      </Svg>

      {children}

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect
          x={0}
          y={w(LEDGE_Y)}
          width={width}
          height={w(LEDGE_HEIGHT)}
          rx={w(LEDGE_HEIGHT / 3)}
          fill={colors.chalkboard.ledge}
        />
        <Rect
          x={0}
          y={w(LEDGE_Y + LEDGE_HEIGHT * 0.7)}
          width={width}
          height={w(LEDGE_HEIGHT * 0.3)}
          rx={w(LEDGE_HEIGHT * 0.15)}
          fill={colors.chalkboard.frameShade}
        />
        {BOOKS.map((book, index) => {
          const bookWidth = w(book.width);
          const x = w(BOOK_CENTER_X + book.shift) - bookWidth / 2;
          const y = height - w(BOOK_HEIGHT) * (index + 1);
          const h = w(BOOK_HEIGHT);
          return (
            <G key={book.cover}>
              <Rect x={x} y={y} width={bookWidth} height={h} rx={h * 0.3} fill={book.cover} />
              <Rect
                x={x + bookWidth - h * 0.9}
                y={y + h * 0.2}
                width={h * 0.7}
                height={h * 0.6}
                rx={h * 0.15}
                fill={colors.chalkboard.bookPages}
              />
              <Rect x={x + h * 0.6} y={y} width={h * 0.35} height={h} fill={colors.chalkboard.bookSpine} />
            </G>
          );
        })}
      </Svg>

      <View
        style={[
          styles.azo,
          {
            left: w(BOOK_CENTER_X) - azoWidth / 2,
            top: booksTop - feetFromTop,
          },
        ]}
      >
        <AzoPortrait size={azoWidth} expression="happy" wearing="glasses" active={active} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  azo: {
    position: 'absolute',
  },
});
