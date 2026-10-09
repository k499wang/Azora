import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

/** The gift's drawings share one 300×300 space so the lid lands on the box. */
export const GIFT_BOX_VIEWBOX = 300;

export interface GiftBoxPalette {
  lidTop: string;
  face: string;
  side: string;
  inside: string;
  shine: string;
}

export const GIFT_BOX_VIOLET: GiftBoxPalette = {
  lidTop: colors.playful.violet.tint,
  face: colors.playful.violet.mid,
  side: colors.playful.violet.base,
  inside: colors.playful.violet.ink,
  shine: colors.playful.violet.soft,
};

// Pale so it still reads as a box when it sits on a blue block.
export const GIFT_BOX_PALE_BLUE: GiftBoxPalette = {
  lidTop: colors.neutral[0],
  face: colors.playful.sky.soft,
  side: colors.playful.sky.tint,
  inside: colors.playful.sky.tintDeep,
  shine: colors.neutral[0],
};

interface PartProps {
  palette: GiftBoxPalette;
}

export function GiftBoxBody({ palette }: PartProps) {
  return (
    <G>
      <Path d="M72 170 108 152H228L192 170Z" fill={palette.inside} />
      <Path d="M186 173 228 152V246L192 262H186Z" fill={palette.side} />
      <Path d="M72 170H192V262H82Q72 262 72 252Z" fill={palette.face} />
      <Path
        d="M84 186V244Q84 250 90 250"
        fill="none"
        stroke={palette.shine}
        strokeWidth="5"
        strokeLinecap="round"
        opacity={0.7}
      />
      <Rect x="121" y="170" width="22" height="92" fill={colors.playful.amber.mid} />
      <Path d="M205.7 163.2 214.3 158.8V250.8L205.7 255.2Z" fill={colors.playful.amber.base} />
    </G>
  );
}

export function GiftBoxLid({ palette }: PartProps) {
  return (
    <G>
      <Path d="M65 140 101 122H235L199 140V142H65Z" fill={palette.lidTop} />
      <Path d="M195 142 235 122V150Q235 154 231 156L199 172H195Z" fill={palette.side} />
      <Path d="M65 140H199V172H71Q65 172 65 166Z" fill={palette.face} />
      <Path d="M65 164H199V172H71Q65 172 65 166Z" fill={palette.side} opacity={0.55} />
      <Path d="M121 140 157 122H179L143 140Z" fill={colors.playful.amber.tint} />
      <Path d="M78.7 133.2 87.3 128.8H221.3L212.7 133.2Z" fill={colors.playful.amber.tint} />
      <Rect x="121" y="140" width="22" height="32" fill={colors.playful.amber.mid} />
      <Path d="M212.7 133.2 221.3 128.8V160.8L212.7 165.2Z" fill={colors.playful.amber.base} />
      <Path d="M150 130C128 98 100 100 102 117 104 132 130 134 150 130Z" fill={colors.playful.amber.mid} />
      <Path d="M150 130C172 98 200 100 198 117 196 132 170 134 150 130Z" fill={colors.playful.amber.mid} />
      <Path
        d="M145 126C130 109 114 109 113 118M155 126C170 109 186 109 187 118"
        fill="none"
        stroke={colors.playful.amber.base}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Ellipse cx="150" cy="129" rx="10" ry="8" fill={colors.playful.amber.base} />
      <Ellipse cx="147" cy="126.5" rx="4" ry="2.5" fill={colors.playful.amber.soft} opacity={0.8} />
    </G>
  );
}

interface Props {
  size: number;
  palette: GiftBoxPalette;
}

/** The closed gift on its own, cropped to the box. */
export default function GiftBoxArt({ size, palette }: Props) {
  return (
    <Svg width={size} height={size} viewBox="58 92 184 184">
      <GiftBoxBody palette={palette} />
      <GiftBoxLid palette={palette} />
    </Svg>
  );
}
