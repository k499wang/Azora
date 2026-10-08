import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Text } from '../common/Text';
import ChalkboardScene, { CHALKBOARD_SCENE_HEIGHT } from './ChalkboardScene';
import OnboardingOptionIcon, { type OnboardingOptionIconName } from './OnboardingOptionIcon';

/** The CBT triangle in chalk: thoughts, feelings and actions on one loop around the word. */

const LOOP_CX = 0.5;
const LOOP_CY = 0.33;
const LOOP_RX = 0.31;
const LOOP_RY = 0.17;
const LOOP_STROKE = 0.009;
/** degrees of loop left open either side of a node, so the chalk meets each word rather than crossing it */
const TOP_GAP = 28;
const SIDE_GAP = 34;
const LOOP_ARCS = [
  { from: 180 + SIDE_GAP, to: 270 - TOP_GAP },
  { from: 270 + TOP_GAP, to: 360 - SIDE_GAP },
  { from: SIDE_GAP, to: 180 - SIDE_GAP },
];

const ICON_SIZE = 0.1;
const NODE_WIDTH = 0.3;
const LABEL_SIZE = 0.04;
const CBT_SIZE = 0.13;

interface Node {
  label: string;
  icon: OnboardingOptionIconName;
  x: number;
  y: number;
}

const NODES: Node[] = [
  { label: 'THOUGHTS', icon: 'lightbulb-on-outline', x: LOOP_CX, y: LOOP_CY - LOOP_RY },
  { label: 'FEELINGS', icon: 'heart-pulse', x: LOOP_CX - LOOP_RX, y: LOOP_CY },
  { label: 'ACTIONS', icon: 'run', x: LOOP_CX + LOOP_RX, y: LOOP_CY },
];

function loopArc(width: number, fromDeg: number, toDeg: number): string {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(LOOP_CX + LOOP_RX * Math.cos(rad)) * width} ${(LOOP_CY + LOOP_RY * Math.sin(rad)) * width}`;
  };
  return `M ${point(fromDeg)} A ${LOOP_RX * width} ${LOOP_RY * width} 0 0 1 ${point(toDeg)}`;
}

interface CbtChalkboardProps {
  width: number;
  active?: boolean;
}

export default function CbtChalkboard({ width, active = true }: CbtChalkboardProps) {
  const w = (fraction: number) => fraction * width;
  const iconSize = w(ICON_SIZE);
  const labelLine = w(LABEL_SIZE * 1.3);
  const nodeHeight = iconSize + labelLine;

  return (
    <ChalkboardScene width={width} active={active}>
      <Svg width={width} height={w(CHALKBOARD_SCENE_HEIGHT)} style={StyleSheet.absoluteFill}>
        {LOOP_ARCS.map((arc) => (
          <Path
            key={arc.from}
            d={loopArc(width, arc.from, arc.to)}
            fill="none"
            stroke={colors.chalkboard.chalkFaint}
            strokeWidth={w(LOOP_STROKE)}
            strokeLinecap="round"
          />
        ))}
      </Svg>

      <Text
        style={[
          styles.cbt,
          {
            top: w(LOOP_CY - CBT_SIZE * 0.62),
            fontSize: w(CBT_SIZE),
            lineHeight: w(CBT_SIZE * 1.2),
          },
        ]}
      >
        CBT
      </Text>

      {NODES.map((node) => (
        <View
          key={node.label}
          style={[
            styles.node,
            {
              left: w(node.x - NODE_WIDTH / 2),
              top: w(node.y) - nodeHeight / 2,
              width: w(NODE_WIDTH),
            },
          ]}
        >
          <OnboardingOptionIcon name={node.icon} size={iconSize} />
          <Text
            style={[
              styles.label,
              { fontSize: w(LABEL_SIZE), lineHeight: labelLine },
            ]}
          >
            {node.label}
          </Text>
        </View>
      ))}
    </ChalkboardScene>
  );
}

const styles = StyleSheet.create({
  cbt: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    color: colors.chalkboard.chalk,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    letterSpacing: 0.6,
    color: colors.chalkboard.chalk,
    textAlign: 'center',
  },
});
