import { useMemo } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { clamp01, easeOutCubic } from '../growth';
import { useSpeciesEntrance } from '../useSpeciesEntrance';
import GrassGround from '../GrassGround';
import type { SpeciesRendererProps } from '../flowerSpecies';

// ─── Palette (rose pinks + teal-family greens) ───────────────────────────────

const ROSE_DEEP = '#D63D7B';
const ROSE_MID = '#F0488F';
const ROSE_LIGHT = '#F98FBC';
const ROSE_CORE = '#FBC7DE';
const STEM = '#2E9E85';
const STEM_DARK = '#237A66';
const LEAF_GREEN = '#4ECDB6';
const HIGHLIGHT = 'rgba(255,255,255,0.72)';

interface Petal {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
}

interface StemLeaf {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
}

interface RoseGeometry {
  baseY: number;
  moundRx: number;
  moundRy: number;
  bloomCx: number;
  bloomCy: number;
  coreRadius: number;
  stemPath: string;
  stemLeaves: StemLeaf[];
  sepals: Petal[];
  petals: Petal[];
  highlights: Petal[];
}

function deg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function buildRoseGeometry(size: number, growth: number, eased: number): RoseGeometry {
  const cx = size / 2;
  const baseY = size * 0.76;
  const moundRx = size * (0.28 + 0.1 * growth);
  const moundRy = size * (0.07 + 0.05 * growth);
  const stemWidth = size * (0.015 + 0.015 * growth);
  const stemHeight = size * (0.24 + 0.14 * eased);
  const bloomRadius = size * (0.14 + 0.12 * eased);
  const bloomCy = baseY - stemHeight - bloomRadius * 0.35;

  // Slightly S-curved stem rising from the ground to the bloom.
  const sw = stemWidth;
  const sh = stemHeight;
  const stemPath = [
    `M${cx - sw * 0.5} ${baseY}`,
    `C${cx - sw * 0.5 + sh * 0.06} ${baseY - sh * 0.5}, ${cx + sw * 0.5 + sh * 0.05} ${baseY - sh * 0.82}, ${cx + sw * 0.45} ${baseY - sh}`,
    `L${cx - sw * 0.45 + sh * 0.05} ${baseY - sh}`,
    `C${cx - sw * 0.5 - sh * 0.03} ${baseY - sh * 0.82}, ${cx - sw * 0.5 - sh * 0.04} ${baseY - sh * 0.5}, ${cx - sw * 0.5} ${baseY}`,
    'Z',
  ].join(' ');

  const stemLeaves: StemLeaf[] = [
    {
      x: cx - size * 0.04,
      y: baseY - stemHeight * 0.45,
      rx: size * 0.05,
      ry: size * 0.022,
      rotation: -28,
      color: LEAF_GREEN,
    },
    {
      x: cx + size * 0.045,
      y: baseY - stemHeight * 0.72,
      rx: size * 0.045,
      ry: size * 0.02,
      rotation: 24,
      color: STEM_DARK,
    },
  ];

  // Sepals (little green leaves hugging the bloom base).
  const sepals: Petal[] = [];
  for (let i = 0; i < 3; i += 1) {
    const angle = Math.PI / 2 + (i - 1) * 0.5;
    sepals.push({
      x: cx + Math.cos(angle) * bloomRadius * 0.5,
      y: bloomCy + Math.sin(angle) * bloomRadius * 0.62,
      rx: bloomRadius * 0.14,
      ry: bloomRadius * 0.3,
      rotation: deg(angle) + 90,
      color: STEM_DARK,
    });
  }

  // Rose petals, layered from the outer ring to the inner core.
  const petals: Petal[] = [];
  const outerCount = eased < 0.12 ? 5 : 8;
  for (let i = 0; i < outerCount; i += 1) {
    const angle = -Math.PI / 2 + (i / outerCount) * Math.PI * 2;
    petals.push({
      x: cx + Math.cos(angle) * bloomRadius * 0.55,
      y: bloomCy + Math.sin(angle) * bloomRadius * 0.55,
      rx: bloomRadius * 0.3,
      ry: bloomRadius * 0.52,
      rotation: deg(angle) + 90,
      color: i % 2 === 0 ? ROSE_DEEP : ROSE_MID,
    });
  }

  const innerCount = eased >= 0.3 ? 6 : eased >= 0.12 ? 4 : 0;
  for (let i = 0; i < innerCount; i += 1) {
    const angle = -Math.PI / 2 + ((i + 0.5) / innerCount) * Math.PI * 2;
    petals.push({
      x: cx + Math.cos(angle) * bloomRadius * 0.28,
      y: bloomCy + Math.sin(angle) * bloomRadius * 0.28,
      rx: bloomRadius * 0.22,
      ry: bloomRadius * 0.38,
      rotation: deg(angle) + 90,
      color: i % 2 === 0 ? ROSE_LIGHT : ROSE_MID,
    });
  }

  const highlights: Petal[] = [
    {
      x: cx - bloomRadius * 0.32,
      y: bloomCy - bloomRadius * 0.34,
      rx: bloomRadius * 0.12,
      ry: bloomRadius * 0.07,
      rotation: -24,
      color: HIGHLIGHT,
    },
    {
      x: cx + bloomRadius * 0.3,
      y: bloomCy - bloomRadius * 0.26,
      rx: bloomRadius * 0.09,
      ry: bloomRadius * 0.055,
      rotation: 28,
      color: HIGHLIGHT,
    },
  ];

  return {
    baseY,
    moundRx,
    moundRy,
    bloomCx: cx,
    bloomCy,
    coreRadius: bloomRadius * 0.2,
    stemPath,
    stemLeaves,
    sepals,
    petals,
    highlights,
  };
}

export function RoseRenderer({ growth, size }: SpeciesRendererProps) {
  const eased = easeOutCubic(growth);
  const geometry = useMemo(
    () => buildRoseGeometry(size, clamp01(growth), eased),
    [eased, growth, size],
  );
  const { opacity, scale } = useSpeciesEntrance();

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Svg width={size} height={size}>
        <GrassGround
          cx={geometry.bloomCx}
          baseY={geometry.baseY}
          moundRx={geometry.moundRx}
          moundRy={geometry.moundRy}
        />

        {/* Stem + leaves */}
        <Path d={geometry.stemPath} fill={STEM} />
        {geometry.stemLeaves.map((leaf, index) => (
          <Ellipse
            key={`leaf-${index}`}
            cx={leaf.x}
            cy={leaf.y}
            rx={leaf.rx}
            ry={leaf.ry}
            rotation={leaf.rotation}
            origin={`${leaf.x}, ${leaf.y}`}
            fill={leaf.color}
          />
        ))}

        {/* Sepals behind the bloom */}
        {geometry.sepals.map((sepal, index) => (
          <Ellipse
            key={`sepal-${index}`}
            cx={sepal.x}
            cy={sepal.y}
            rx={sepal.rx}
            ry={sepal.ry}
            rotation={sepal.rotation}
            origin={`${sepal.x}, ${sepal.y}`}
            fill={sepal.color}
          />
        ))}

        {/* Outer petals, then inner petals, then the core */}
        {geometry.petals.map((petal, index) => (
          <Ellipse
            key={`petal-${index}`}
            cx={petal.x}
            cy={petal.y}
            rx={petal.rx}
            ry={petal.ry}
            rotation={petal.rotation}
            origin={`${petal.x}, ${petal.y}`}
            fill={petal.color}
          />
        ))}
        <Circle
          cx={geometry.bloomCx}
          cy={geometry.bloomCy}
          r={geometry.coreRadius}
          fill={ROSE_CORE}
        />
        <Circle
          cx={geometry.bloomCx}
          cy={geometry.bloomCy}
          r={geometry.coreRadius * 0.45}
          fill={ROSE_DEEP}
        />

        {/* Glossy highlights */}
        {geometry.highlights.map((highlight, index) => (
          <Ellipse
            key={`highlight-${index}`}
            cx={highlight.x}
            cy={highlight.y}
            rx={highlight.rx}
            ry={highlight.ry}
            rotation={highlight.rotation}
            origin={`${highlight.x}, ${highlight.y}`}
            fill={highlight.color}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}
