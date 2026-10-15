/**
 * Azora — hex room + decorations (React Native)
 *
 * Requires: react-native-svg  ->  npx expo install react-native-svg
 *
 *   import { HexRoom, DAYS, DECOR_KEYS } from './RoomScene';
 *
 *   <HexRoom width={280} picks={{ day1: 'checker_rug', day2: 'study_desk' }} />
 *
 * Every decoration is authored in the same isometric room space, so any
 * option of a day can be swapped for any other without repositioning.
 * Paint order is day 6 -> 5 -> 7 -> 1 -> 3 -> 2 -> 4 (back to front).
 */
import Svg, { G, Polygon } from 'react-native-svg';

/**
 * `sh` marks a cast shadow — the patch a decoration throws on the floor or the
 * wall behind it. It belongs to the room, not the object: it is drawn first,
 * sits under everything, and reads as a shadow only because there is a surface
 * under it. Anything drawing a decoration on its own must leave it out, or it
 * is a grey smear hanging off the piece. See `soloPolys` in `roomStage.tsx`.
 */
export type Poly = {
  p: string;
  f?: string;
  o?: number;
  s?: string;
  w?: number;
  sh?: 1;
};

export type DayKey = 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7';
export type Picks = Partial<Record<DayKey, string>>;
export type FrameHue = 'sky' | 'teal' | 'blush';

import { colors } from '../../theme/colors';
import { ROOM_ASPECT, VIEW_BOX } from './roomGeometry';
import { roomFrameFor } from './roomFrameRegistry';
import { ROOM_DECOR } from './decor';

export {
  ROOM_ASPECT,
  VIEW_BOX,
  VIEW_BOX_HEIGHT,
  VIEW_BOX_WIDTH,
} from './roomGeometry';

/** walls, floor, planks, corner shading — drawn first */
export const ROOM_SHELL: Poly[] = [{"p":"0,-180 -155.9,-90 -155.9,90 0,0","f":"#FCF4DE"},{"p":"0,-180 155.9,-90 155.9,90 0,0","f":"#F4E9C8"},{"p":"0,-172 -6.9,-168 -6.9,4 0,0","f":"rgba(58,67,79,.05)"},{"p":"0,-172 6.9,-168 6.9,4 0,0","f":"rgba(58,67,79,.07)"},{"p":"0,0 155.9,90 0,180 -155.9,90","f":"#EBCA92"},{"p":"-31.2,18 124.7,108 123,109 -32.9,19","f":"#DEB979"},{"p":"-62.4,36 93.5,126 91.8,127 -64.1,37","f":"#DEB979"},{"p":"-93.5,54 62.4,144 60.6,145 -95.3,55","f":"#DEB979"},{"p":"-124.7,72 31.2,162 29.4,163 -126.4,73","f":"#DEB979"},{"p":"0,0 6.9,4 -149,94 -155.9,90","f":"rgba(58,67,79,.05)"},{"p":"0,0 155.9,90 149,94 -6.9,4","f":"rgba(58,67,79,.05)"},{"p":"0,-6 -155.9,84 -155.9,90 0,0","f":"#F0E2BC"},{"p":"0,-6 155.9,84 155.9,90 0,0","f":"#EDDDB2"}];

/**
 * The frame is the room's own thickness, not a line drawn around it.
 *
 * Each wall is extruded along its own outward normal, which in this projection
 * means the left wall's slab shears up-and-left, the right wall's up-and-right,
 * and the floor's drops straight down. Offsetting the hexagon uniformly instead
 * — the obvious thing — gives a picture-frame bevel with no depth at all, which
 * is the whole difference between this reading as a solid and reading as a
 * border. At the back corner the two slabs stop against each other rather than
 * carrying on to a point: walls end where they meet, and running them out to a
 * peak turns the junction into a spike standing above the room.
 *
 * Every point below is `vertex + offset` at a thickness of 0.095 of a floor
 * axis, worked out once and written down: the artwork in this file is data, and
 * a frame that recomputed itself at import would be the only part that is not.
 */
/**
 * The five tones a frame is cut in, lightest first. They are the light on the
 * solid, not a colour scheme: which face is brighter is fixed by where the
 * light sits, so a shell supplies its own five and the reading stays the same.
 */
export interface FramePalette {
  /** both wall tops */
  cap: string;
  baseLeft: string;
  sideLeft: string;
  baseRight: string;
  sideRight: string;
}

export function buildRoomFrame(palette: FramePalette): Poly[] {
  return [
    { p: '0,-180 -155.9,-90 -170.7,-98.6 -14.8,-188.6', f: palette.cap },
    { p: '155.9,-90 0,-180 14.8,-188.6 170.7,-98.6', f: palette.cap },
    { p: '-155.9,-90 -155.9,90 -170.7,81.4 -170.7,-98.6', f: palette.sideLeft },
    { p: '155.9,90 155.9,-90 170.7,-98.6 170.7,81.4', f: palette.sideRight },
    // The slab runs out under both walls rather than stopping at the hexagon:
    // the extrusion is parallel to the floor's own front edges, so carrying it
    // past them keeps the same line and closes the notch it would leave.
    { p: '-170.7,81.4 0,180 0,197.1 -170.7,98.5', f: palette.baseLeft },
    { p: '0,180 170.7,81.4 170.7,98.5 0,197.1', f: palette.baseRight },
    // Where a side wall lands on the slab, the slab's own end shows under it —
    // a block as wide as the wall is thick and as deep as the slab: the room's
    // foot, read by tone alone like every other crease in the solid.
    { p: '-170.7,81.4 -155.9,90 -155.9,107.1 -170.7,98.5', f: palette.baseLeft },
    { p: '170.7,81.4 155.9,90 155.9,107.1 170.7,98.5', f: palette.baseRight },
  ];
}

/** the frame the generated `ROOM_SHELL` above is cut in */
export const ROOM_FRAME: Poly[] = buildRoomFrame(colors.roomFrame);

/** a faint outline used when a room is previewed empty */
export const GHOST_FRAME: Poly[] = [{"p":"0,-180 -155.9,-90 -155.9,90 0,180 155.9,90 155.9,-90","s":"#CBD5E1","w":3}];

/** every decoration, keyed "<dayKey>.<optionId>" */
export const DECOR: Record<string, Poly[]> = ROOM_DECOR;

export const DECOR_KEYS = Object.keys(DECOR);

/** day slots, their placement note, and the five options each offers */
export const DAYS: { key: DayKey; title: string; note: string; options: { id: string; name: string }[] }[] = [
  {
    key: "day1",
    title: "Day 1 — Rug",
    note: "floor centerpiece",
    options: [
      {
        id: "checker_rug",
        name: "Checker rug"
      },
      {
        id: "braided_round_rug",
        name: "Braided round rug"
      },
      {
        id: "striped_runner",
        name: "Striped runner"
      },
      {
        id: "patch_quilt",
        name: "Patch quilt"
      },
      {
        id: "cloud_rug",
        name: "Cloud rug"
      }
    ]
  },
  {
    key: "day2",
    title: "Day 2 — Big furniture",
    note: "floor, against right wall",
    options: [
      {
        id: "study_desk",
        name: "Study desk"
      },
      {
        id: "vanity",
        name: "Vanity"
      },
      {
        id: "dresser",
        name: "Dresser"
      },
      {
        id: "upright_piano",
        name: "Upright piano"
      },
      {
        id: "tea_cart",
        name: "Tea cart"
      }
    ]
  },
  {
    key: "day3",
    title: "Day 3 — Small furniture",
    note: "floor, against left wall",
    options: [
      {
        id: "etagere",
        name: "Étagère"
      },
      {
        id: "bookcase",
        name: "Bookcase"
      },
      {
        id: "plant_ladder",
        name: "Plant ladder"
      },
      {
        id: "record_console",
        name: "Record console"
      },
      {
        id: "wardrobe",
        name: "Wardrobe"
      }
    ]
  },
  {
    key: "day4",
    title: "Day 4 — Floor accent",
    note: "front right, on the rug",
    options: [
      {
        id: "monstera",
        name: "Monstera"
      },
      {
        id: "cactus_duo",
        name: "Cactus duo"
      },
      {
        id: "flower_bucket",
        name: "Flower bucket"
      },
      {
        id: "fishbowl",
        name: "Fishbowl"
      },
      {
        id: "lemon_tree",
        name: "Lemon tree"
      }
    ]
  },
  {
    key: "day5",
    title: "Day 5 — Wall art",
    note: "left wall",
    options: [
      {
        id: "pin_board",
        name: "Pin board"
      },
      {
        id: "gallery_wall",
        name: "Gallery wall"
      },
      {
        id: "mirror",
        name: "Mirror"
      },
      {
        id: "wall_clock",
        name: "Wall clock"
      },
      {
        id: "macrame",
        name: "Macramé"
      }
    ]
  },
  {
    key: "day6",
    title: "Day 6 — Window",
    note: "right wall",
    options: [
      {
        id: "day_window",
        name: "Day window"
      },
      {
        id: "night_window",
        name: "Night window"
      },
      {
        id: "porthole",
        name: "Porthole"
      },
      {
        id: "greenhouse_shelf",
        name: "Greenhouse shelf"
      },
      {
        id: "stained_glass",
        name: "Stained glass"
      }
    ]
  },
  {
    key: "day7",
    title: "Day 7 — Garland",
    note: "both wall tops",
    options: [
      {
        id: "flag_bunting",
        name: "Flag bunting"
      },
      {
        id: "fairy_lights",
        name: "Fairy lights"
      },
      {
        id: "paper_lanterns",
        name: "Paper lanterns"
      },
      {
        id: "ivy_vine",
        name: "Ivy vine"
      },
      {
        id: "star_string",
        name: "Star string"
      }
    ]
  }
];

/** back-to-front paint order for a filled room */
export const PAINT_ORDER: DayKey[] = ['day6', 'day5', 'day7', 'day1', 'day3', 'day2', 'day4'];

export const Polys = ({ polys }: { polys: Poly[] }) => (
  <>
    {polys.map((q, k) => (
      <Polygon
        key={k}
        points={q.p}
        fill={q.f ?? 'none'}
        opacity={q.o ?? 1}
        stroke={q.s ?? 'none'}
        strokeWidth={q.w ?? 0}
        strokeLinejoin="round"
      />
    ))}
  </>
);

export type HexRoomProps = {
  /** rendered width in dp; height follows from ROOM_ASPECT */
  width?: number;
  /** which option is placed in each day slot; omit a day to leave it empty */
  picks?: Picks;
  /**
   * Kept for the callers that store a room's hue, though the frame now takes
   * its colour from the shell it is cutting through.
   */
  frameHue?: FrameHue;
  /** walls, floor and trim; defaults to the original room. See `roomShells.ts`. */
  shell?: Poly[];
  /** render the shell at 35% for a single-decoration preview tile */
  ghost?: boolean;
};

export const HexRoom = ({ width = 280, picks = {}, shell = ROOM_SHELL, ghost = false }: HexRoomProps) => {
  const placed = PAINT_ORDER.map((day) => {
    const id = picks[day];
    // Decorations are drawn without the cast shadow authored alongside them;
    // see `withoutShadow` in `roomLayers.ts` for why the room stays unlit.
    return id ? DECOR[day + '.' + id]?.filter((poly) => poly.sh !== 1) : undefined;
  }).filter(Boolean) as Poly[][];

  return (
    <Svg width={width} height={width * ROOM_ASPECT} viewBox={VIEW_BOX}>
      <G opacity={ghost ? 0.35 : 1}>
        <Polys polys={shell} />
      </G>
      {placed.map((polys, k) => (
        <Polys key={k} polys={polys} />
      ))}
      <Polys polys={ghost ? GHOST_FRAME : roomFrameFor(shell, ROOM_FRAME)} />
    </Svg>
  );
};

/** one decoration on its own, over a ghosted room — for pickers and asset sheets */
export const DecorationTile = ({
  day,
  option,
  width = 180,
  shell = ROOM_SHELL,
}: {
  day: DayKey;
  option: string;
  width?: number;
  shell?: Poly[];
}) => (
  <Svg width={width} height={width * ROOM_ASPECT} viewBox={VIEW_BOX}>
    <G opacity={0.35}>
      <Polys polys={shell} />
    </G>
    <Polys polys={GHOST_FRAME} />
    <Polys polys={(DECOR[day + '.' + option] ?? []).filter((poly) => poly.sh !== 1)} />
  </Svg>
);

export default HexRoom;
