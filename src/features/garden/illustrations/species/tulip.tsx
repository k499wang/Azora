import { useMemo } from 'react';
import { Animated } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { clamp01, easeOutCubic } from '../growth';
import { useSpeciesEntrance } from '../useSpeciesEntrance';
import GrassGround from '../GrassGround';
import type { SpeciesRendererProps } from '../flowerSpecies';

// ─── Palette (coral-red tulip on the shared grass-dome ground) ───────────────

const TULIP_DARK = '#C23A2E';
const TULIP_MID = '#E8483E';
const TULIP_LIGHT = '#F57A6B';
const STEM = '#2E9E85';
const STEM_DARK = '#237A66';
const LEAF_GREEN = '#4ECDB6';
const HIGHLIGHT = 'rgba(255,255,255,0.72)';

interface TulipGeometry {
  baseY: number;
  moundRx: number;
  moundRy: number;
  bloomCx: number;
  bloomCy: number;
  bloomRadius: number;
  stemHeight: number;
  stemPath: string;
}

function buildTulipGeometry(
  size: number,
  growth: number,
  eased: number,
): TulipGeometry {
  const cx = size / 2;
  const baseY = size * 0.76;
  const moundRx = size * (0.28 + 0.1 * growth);
  const moundRy = size * (0.07 + 0.05 * growth);
  const stemWidth = size * (0.018 + 0.014 * growth);
  const stemHeight = size * (0.26 + 0.14 * eased);
  const bloomRadius = size * (0.15 + 0.11 * eased);
  const bloomCy = baseY - stemHeight - bloomRadius * 0.2;

  const sw = stemWidth;
  const sh = stemHeight;
  const stemPath = [
    `M${cx - sw * 0.5} ${baseY}`,
    `C${cx - sw * 0.6} ${baseY - sh * 0.55}, ${cx - sw * 0.5} ${baseY - sh * 0.85}, ${cx - sw * 0.45} ${baseY - sh}`,
    `L${cx + sw * 0.45} ${baseY - sh}`,
    `C${cx + sw * 0.5} ${baseY - sh * 0.85}, ${cx + sw * 0.6} ${baseY - sh * 0.55}, ${cx + sw * 0.5} ${baseY}`,
    'Z',
  ].join(' ');

  return {
    baseY,
    moundRx,
    moundRy,
    bloomCx: cx,
    bloomCy,
    bloomRadius,
    stemHeight,
    stemPath,
  };
}

export function TulipRenderer({ growth, size }: SpeciesRendererProps) {
  const eased = easeOutCubic(growth);
  const geometry = useMemo(
    () => buildTulipGeometry(size, clamp01(growth), eased),
    [eased, growth, size],
  );
  const { opacity, scale } = useSpeciesEntrance();

  const { bloomCx, bloomCy, bloomRadius: r, stemHeight } = geometry;

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Svg width={size} height={size}>
        <GrassGround
          cx={bloomCx}
          baseY={geometry.baseY}
          moundRx={geometry.moundRx}
          moundRy={geometry.moundRy}
        />

        {/* Stem */}
        <Path d={geometry.stemPath} fill={STEM} />

        {/* Leaves hugging the stem, anchored to its height */}
        <Ellipse
          cx={bloomCx - size * 0.05}
          cy={geometry.baseY - stemHeight * 0.48}
          rx={size * 0.055}
          ry={size * 0.028}
          rotation={-32}
          origin={`${bloomCx - size * 0.05}, ${geometry.baseY - stemHeight * 0.48}`}
          fill={LEAF_GREEN}
        />
        <Ellipse
          cx={bloomCx + size * 0.055}
          cy={geometry.baseY - stemHeight * 0.26}
          rx={size * 0.05}
          ry={size * 0.025}
          rotation={26}
          origin={`${bloomCx + size * 0.055}, ${geometry.baseY - stemHeight * 0.26}`}
          fill={STEM_DARK}
        />

        {/* Tulip bloom: back petal, then two front petals */}
        <Ellipse
          cx={bloomCx}
          cy={bloomCy}
          rx={r * 0.62}
          ry={r * 0.95}
          fill={TULIP_DARK}
        />
        <Ellipse
          cx={bloomCx - r * 0.3}
          cy={bloomCy + r * 0.14}
          rx={r * 0.52}
          ry={r * 0.88}
          rotation={-14}
          origin={`${bloomCx - r * 0.3}, ${bloomCy + r * 0.14}`}
          fill={TULIP_MID}
        />
        <Ellipse
          cx={bloomCx + r * 0.3}
          cy={bloomCy + r * 0.14}
          rx={r * 0.52}
          ry={r * 0.88}
          rotation={14}
          origin={`${bloomCx + r * 0.3}, ${bloomCy + r * 0.14}`}
          fill={TULIP_LIGHT}
        />

        {/* Sheen on the top petal */}
        <Ellipse
          cx={bloomCx - r * 0.1}
          cy={bloomCy - r * 0.45}
          rx={r * 0.16}
          ry={r * 0.3}
          rotation={-8}
          origin={`${bloomCx - r * 0.1}, ${bloomCy - r * 0.45}`}
          fill={HIGHLIGHT}
        />
      </Svg>
    </Animated.View>
  );
}
