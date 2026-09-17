import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Mask, Path, Rect } from 'react-native-svg';
import { Text } from '../../components/common/Text';
import AzoAside from '../../components/onboarding/AzoAside';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  arrowOffsetX,
  placeCluster,
  type TourRect,
  type TourViewport,
} from './tourGeometry';

/**
 * The look of one tour stop: the dimmed screen with a hole in it, Azo pointing
 * into the hole, and the position in the run.
 *
 * Both presenters render this. The informational stops live in a native Modal
 * and advance on any tap; the two first-session stops are rendered inline,
 * over the live app, because the user has to reach the real control through
 * the hole — a Modal would swallow that tap. Only the mounting differs, so the
 * chrome lives here and neither presenter draws its own.
 */

export const CLUSTER_HEIGHT = 190;
export const ARROW_WIDTH = 40;
export const ARROW_HEIGHT = 56;
export const TOP_CONTROL_HEIGHT = 56;
export const BOTTOM_META_HEIGHT = 48;

interface TourCutoutProps {
  maskId: string;
  width: number;
  height: number;
  hole: TourRect | null;
}

/**
 * The dimmed screen with the stop punched out of it.
 *
 * The wrapping View is what actually makes the hole a hole. `RNSVGSvgView`
 * hit-tests its own children and ignores the `pointerEvents` it was given, and
 * the mask is a *drawing* instruction — the scrim rect it masks still covers
 * the whole screen for touch purposes. So the Svg on its own swallows every
 * tap, including the one meant for the control the cutout is showing. A real
 * RN view with `pointerEvents="none"` is skipped during hit testing entirely,
 * so nothing inside it is ever asked.
 */
export function TourCutout({ maskId, width, height, hole }: TourCutoutProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id={maskId}>
            <Rect x={0} y={0} width={width} height={height} fill="white" />
            {hole == null ? null : (
              <Rect
                x={hole.x}
                y={hole.y}
                width={hole.width}
                height={hole.height}
                rx={radius.card}
                ry={radius.card}
                fill="black"
              />
            )}
          </Mask>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={colors.photoScrim.medium}
          mask={`url(#${maskId})`}
        />
      </Svg>
    </View>
  );
}

interface TourClusterProps {
  hole: TourRect;
  viewport: TourViewport;
  body: string;
  left: number;
  right: number;
  width: number;
  opacity?: Animated.Value;
}

export function TourCluster({
  hole,
  viewport,
  body,
  left,
  right,
  width,
  opacity,
}: TourClusterProps) {
  const placement = placeCluster(hole, viewport, CLUSTER_HEIGHT, spacing.sm);
  const arrowLeft = arrowOffsetX(hole, left, width, ARROW_WIDTH);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cluster,
        {
          left,
          right,
          top: placement.top,
          height: placement.height,
          opacity: opacity ?? 1,
        },
      ]}
    >
      {placement.pointsDown ? null : <Arrow direction="up" left={arrowLeft} />}
      <View style={styles.speech}>
        <AzoAside text={body} delayMs={0} />
      </View>
      {placement.pointsDown ? <Arrow direction="down" left={arrowLeft} /> : null}
    </Animated.View>
  );
}

export function TourCounter({ index, total }: { index: number; total: number }) {
  return (
    <Text pointerEvents="none" style={styles.counter}>
      {index + 1} of {total}
    </Text>
  );
}

/** The way out of a run, in either presenter. */
export function TourSkipButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel="Skip"
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={spacing.md}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Text style={styles.skip}>Skip</Text>
    </Pressable>
  );
}

function Arrow({ direction, left }: { direction: 'up' | 'down'; left: number }) {
  const isDown = direction === 'down';
  return (
    <Svg
      width={ARROW_WIDTH}
      height={ARROW_HEIGHT}
      viewBox="0 0 40 56"
      style={{ marginLeft: left }}
    >
      <Path
        d={isDown ? 'M20 4 C20 26, 20 34, 20 48' : 'M20 52 C20 30, 20 22, 20 8'}
        fill="none"
        stroke={colors.text.brand}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d={isDown ? 'M13 41 L20 50 L27 41' : 'M13 15 L20 6 L27 15'}
        fill="none"
        stroke={colors.text.brand}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  cluster: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  speech: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  counter: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    opacity: 0.7,
  },
  skip: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  pressed: { opacity: 0.7 },
});
