import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { colors } from '../../theme/colors';
import MochiMouth, { type MochiMouthKind } from './MochiMouth';

/**
 * The room's resident, standing still.
 *
 * Same geometry and same palette as `RoomBlob` — filled body, sheen, feet and
 * ground shadow — so a blob drawn outside the room is recognisably the blob
 * inside it. `RoomBlob` owns the walking, blinking and cheering; this owns
 * nothing but the pose, which is why it can be a plain memoised View tree.
 *
 * These constants mirror `RoomBlob`'s deliberately rather than importing them:
 * that file measures in the room's viewBox units, and this one measures in the
 * body width a caller asks for.
 *
 * Everything is drawn from rounded Views in body units rather than from image
 * assets. That is what lets a sprite scale to any `size` without a @2x/@3x set,
 * recolour from `colors.ts` with the rest of the app, and cost nothing in the
 * bundle.
 */
const BODY_W = 56;
const BODY_H = 66;
const BODY_LIFT = 4;
/** the line that wraps him; the eyes and mouth are the same ink */
const INK = 1.6;
/** A subtly narrow crown flowing into a full lower half and broad soft base. */
const BODY_PATH =
  'M28 1 C13 1 3 11 3 27 C3 34 2 40 2 45 C2 56 13 65 28 65 C43 65 54 56 54 45 C54 40 53 34 53 27 C53 11 43 1 28 1 Z';
const FOOT_W = 17;
const FOOT_H = 11.5;
const FOOT_X = 11.5;
const SHADOW_W = 62;
const SHADOW_H = 17;
/**
 * The nubs. They are arms only in the sense that they are on the sides — barely
 * a lobe each, drawn behind him so his own outline crosses their base and the
 * three shapes stay one creature. `NUB_OUT` is all that shows.
 */
const NUB_W = 11;
const NUB_H = 9.5;
const NUB_OUT = 5.5;
const NUB_TOP = 37;
/** the right nub hangs a shade lower — he is not a corporate icon */
const NUB_DROP = 1;
const EYE_SHIFT = 1.5;
const EYE_DX = 12;
const EYE_RISE = 1;
const MOUTH_RISE = 0.5;

/** the centre of the face, in body units */
const FACE_CX = BODY_W / 2 + EYE_SHIFT;

/**
 * How he is feeling.
 *
 * One blob with nine expressions reads as a character, where nine differently
 * shaped blobs read as nine mascots — so his shape never changes. What changes
 * is his face and, just as much, how he stands: see `Pose` below.
 */
export type MochiExpression =
  | 'happy'
  | 'sad'
  | 'sleepy'
  | 'excited'
  | 'thinking'
  | 'surprised'
  | 'proud'
  | 'puffed'
  | 'pleased';

/**
 * Props come in two slots so a screen can put him in glasses *and* hand him a
 * pencil, while the pairs that would sit on top of each other — a party hat and
 * a nightcap — stay unrepresentable.
 *
 * Props that need room above or beside him grow the sprite's box rather than
 * spilling out of it: Android clips children that overflow their parent, so
 * anything poking outside the bounds would render on iOS and be cut off on
 * Android.
 */
export type MochiWearable = 'glasses' | 'headphones' | 'partyHat' | 'nightcap';

export type MochiHeld = 'pencil' | 'book' | 'notes';

interface EyeShape {
  w: number;
  h: number;
  top: number;
  /** rounds only the top edge, for the closed happy arc */
  arc?: boolean;
  /** draws a `>` and a `<` instead of a filled eye, for squeezed shut */
  chevron?: boolean;
  /** how far each eye sits from the centre of the face, over `EYE_DX` */
  dx?: number;
}

interface MouthShape {
  w: number;
  h: number;
  top: number;
  kind: MochiMouthKind;
}

interface Face {
  eye: EyeShape;
  mouth: MouthShape;
  /** squints the far eye, for a look off to one side */
  squint?: boolean;
}

/** where a foot sits relative to where it rests, in body units */
interface FootOffset {
  /** sideways, positive towards the right of the sprite */
  dx?: number;
  /** up off the floor */
  dy?: number;
}

/**
 * The body's share of an expression.
 *
 * A face alone is not enough. Nine faces on one identical body give nine sprites
 * with the same silhouette, and at the size he appears in a speech bubble the
 * silhouette is most of what anyone sees. Leaning, squatting and reaching are
 * what make the moods read apart — he is never a different shape, only ever
 * standing differently.
 *
 * Every field here is a number on a View that already exists, so a pose costs no
 * new element and no new art.
 */
interface Pose {
  /** degrees of lean, hinged at the floor so his feet stay planted; ±8 is the limit */
  tilt?: number;
  /** volume is kept: above 1 is taller and narrower, below is shorter and wider */
  stretch?: number;
  /** body units off the floor; his shadow pulls in and lightens to match */
  lift?: number;
  /** left foot then right; the asymmetry is what stops him reading as a mannequin */
  feet?: [FootOffset, FootOffset];
  /** how much of the eye a lowered lid covers, 0 to 1 */
  lid?: number;
}

interface Sprite {
  face: Face;
  pose: Pose;
}

const SPRITES: Record<MochiExpression, Sprite> = {
  happy: {
    face: {
      eye: { w: 5.4, h: 6, top: 21 },
      mouth: { w: 13, h: 6, top: 26, kind: 'smile' },
    },
    pose: { tilt: 5, feet: [{ dx: -1 }, { dx: 2, dy: 1.5 }] },
  },
  sad: {
    face: {
      eye: { w: 5.4, h: 3.6, top: 22.5 },
      mouth: { w: 10, h: 4.5, top: 29, kind: 'frown' },
    },
    /** shorter, drawn in on himself, lids down */
    pose: {
      tilt: -4,
      stretch: 0.93,
      lid: 0.32,
      feet: [{ dx: 3.5 }, { dx: -3.5 }],
    },
  },
  sleepy: {
    face: {
      eye: { w: 6, h: 1.6, top: 24 },
      mouth: { w: 8, h: 4.5, top: 28, kind: 'smile' },
    },
    /** listing over, about to go */
    pose: { tilt: 8, stretch: 0.96, lid: 0.35, feet: [{ dx: 2 }, { dx: 4 }] },
  },
  excited: {
    face: {
      eye: { w: 6, h: 6.8, top: 20.5 },
      mouth: { w: 7, h: 5.4, top: 27, kind: 'open' },
    },
    /** the only pose with both feet off the floor */
    pose: {
      stretch: 1.09,
      lift: 5,
      feet: [
        { dx: -3, dy: 3 },
        { dx: 3, dy: 5 },
      ],
    },
  },
  thinking: {
    face: {
      eye: { w: 5.4, h: 6, top: 21 },
      mouth: { w: 6, h: 2, top: 29, kind: 'line' },
      squint: true,
    },
    /** leaning back from the thing he is weighing up, one foot forward */
    pose: { tilt: -5, lid: 0.12, feet: [{ dx: -2 }, { dx: 5 }] },
  },
  surprised: {
    face: {
      eye: { w: 6.4, h: 7.4, top: 20 },
      mouth: { w: 4.4, h: 4.6, top: 27.5, kind: 'open' },
    },
    /** pulled up short, feet apart */
    pose: { stretch: 1.07, lift: 2, feet: [{ dx: -4 }, { dx: 4 }] },
  },
  proud: {
    face: {
      eye: { w: 6, h: 3, top: 22.5, arc: true },
      mouth: { w: 14, h: 6, top: 26.5, kind: 'smile' },
    },
    /** chest up, planted */
    pose: { stretch: 1.05, feet: [{ dx: -3.5 }, { dx: 3.5 }] },
  },
  /** eyes open, mouth closed and curved: happy without the grin */
  pleased: {
    face: {
      eye: { w: 5.4, h: 6, top: 21 },
      mouth: { w: 13, h: 6, top: 26, kind: 'smile' },
    },
    pose: { tilt: 6, stretch: 0.99, feet: [{ dx: 1 }, { dx: 2.5 }] },
  },
  /** eyes screwed shut, lips pushing the air out */
  puffed: {
    face: {
      eye: { w: 4.6, h: 6.4, top: 20, chevron: true, dx: 12 },
      mouth: { w: 5.4, h: 6.4, top: 26.5, kind: 'open' },
    },
    /** upright and planted, so all the effort reads in the face */
    pose: { feet: [{ dx: -2.5 }, { dx: 2.5 }] },
  },
};

const RESTING_FEET: [FootOffset, FootOffset] = [{}, {}];

/** extra room a worn prop needs above his head, in body units */
const HEADROOM: Record<MochiWearable, number> = {
  glasses: 0,
  headphones: 3,
  partyHat: 17,
  nightcap: 15,
};

/** extra room a held prop needs on either side, in body units */
const SIDEROOM: Record<MochiHeld, number> = {
  pencil: 8,
  book: 10,
  notes: 8,
};

/**
 * A lean swings his top corners out past his own width and a wide stance pushes
 * a foot out past it, in body units. Android clips whatever leaves the box, so
 * the box grows by this instead of letting him spill.
 */
function poseSideroom(pose: Pose, bodyW: number, bodyH: number) {
  const radians = ((pose.tilt ?? 0) * Math.PI) / 180;
  const leaned =
    (bodyW / 2 + NUB_OUT) * Math.cos(radians) +
    bodyH * Math.abs(Math.sin(radians));
  const planted = (pose.feet ?? RESTING_FEET).reduce(
    (widest, foot, index) =>
      Math.max(
        widest,
        Math.abs((index === 0 ? -FOOT_X : FOOT_X) + (foot.dx ?? 0)) +
          FOOT_W / 2,
      ),
    0,
  );
  return Math.max(0, leaned - SHADOW_W / 2, planted - SHADOW_W / 2);
}

/**
 * How much wider than his body the sprite's box is on each side, once he is
 * holding something and once his pose has been allowed for. A caller placing him
 * against other art lines up his body, not the box, so it needs this to cancel
 * the growth out.
 */
export function getMochiSideroom(
  size: number,
  holding?: MochiHeld,
  expression: MochiExpression = 'happy',
) {
  const { pose } = SPRITES[expression];
  const stretch = pose.stretch ?? 1;
  const room =
    (holding ? SIDEROOM[holding] : 0) +
    poseSideroom(pose, BODY_W / stretch, BODY_H * stretch);
  return (room * size) / BODY_W;
}

/** the blush, out past the eyes and a little below them */
const CHEEK_W = 8;
const CHEEK_H = 8;
const CHEEK_DX = 17;
const CHEEK_TOP = 27.6;

const EYE_STROKE = 1.8;
const LENS = 11;
const RIM = 2;
const BRIDGE = 4;
const BAND_W = 52;
const BAND_H = 17;
const BAND_RIM = 3;
const CUP_W = 9;
const CUP_H = 13;
const PENCIL_W = 5;
const PENCIL_H = 28;
const BOOK_W = 22;
const BOOK_H = 17;
const NOTES_W = 24;
const NOTES_H = 19;
const HAT_W = 22;
const HAT_H = 20;
const CAP_W = 26;
const CAP_H = 20;

interface MochiPortraitProps {
  /** rendered width of the body; everything else scales from it */
  size: number;
  expression?: MochiExpression;
  wearing?: MochiWearable;
  holding?: MochiHeld;
}

function MochiPortrait({
  size,
  expression = 'happy',
  wearing,
  holding,
}: MochiPortraitProps) {
  const u = size / BODY_W;
  const headroom = wearing ? HEADROOM[wearing] : 0;
  const sideroom = holding ? SIDEROOM[holding] : 0;
  const { face, pose } = SPRITES[expression];
  const isPuffed = expression === 'puffed';
  const faceCenterX = isPuffed ? BODY_W / 2 : FACE_CX;

  const tilt = pose.tilt ?? 0;
  const stretch = pose.stretch ?? 1;
  const lift = pose.lift ?? 0;
  const lid = pose.lid ?? 0;
  const feet = pose.feet ?? RESTING_FEET;
  const bodyW = BODY_W / stretch;
  const bodyH = BODY_H * stretch;
  /** the face is measured in body units, so it has to ride the stretch */
  const fx = 1 / stretch;
  const fy = stretch;

  const spriteW = bodyW + NUB_OUT * 2;
  const poseroom = poseSideroom(pose, bodyW, bodyH);
  const width = (SHADOW_W + (sideroom + poseroom) * 2) * u;
  const height =
    (BODY_H +
      BODY_LIFT +
      SHADOW_H +
      headroom +
      Math.max(0, bodyH + lift - BODY_H)) *
    u;
  /** the floor line, measured up from the bottom of the box */
  const contact = (SHADOW_H / 2) * u;
  /** the top of his head, measured up from the bottom of the box */
  const crown = contact + (BODY_LIFT + lift + bodyH) * u;
  /** off the floor, so the shadow pulls in under him and lightens */
  const airborne = Math.min(lift, 8) / 8;
  const shadowScale = 1 - airborne * 0.35;

  return (
    <View style={{ width, height }}>
      <View
        style={[
          styles.shadow,
          {
            left: (width - SHADOW_W * shadowScale * u) / 2,
            bottom: ((SHADOW_H - SHADOW_H * shadowScale) / 2) * u,
            width: SHADOW_W * shadowScale * u,
            height: SHADOW_H * shadowScale * u,
            borderRadius: (SHADOW_H / 2) * shadowScale * u,
            opacity: 1 - airborne * 0.55,
          },
        ]}
      />

      {feet.map((foot, index) => {
        const rest = index === 0 ? -FOOT_X : FOOT_X;

        return (
          <View
            key={index}
            style={[
              styles.foot,
              {
                left: width / 2 + (rest + (foot.dx ?? 0) - FOOT_W / 2) * u,
                bottom: contact + ((foot.dy ?? 0) + lift) * u,
                width: FOOT_W * u,
                height: FOOT_H * u,
                borderRadius: (FOOT_H / 2) * u,
                borderWidth: INK * u,
              },
            ]}
          />
        );
      })}

      {holding === 'book' ? <Book u={u} width={width} bodyW={bodyW} /> : null}
      {holding === 'pencil' || holding === 'notes' ? (
        <Pencil u={u} width={width} bodyW={bodyW} />
      ) : null}

      <View
        style={[
          styles.sprite,
          {
            left: (width - spriteW * u) / 2,
            bottom: contact + (BODY_LIFT + lift) * u,
            width: spriteW * u,
            height: bodyH * u,
            transform: [{ rotate: `${tilt}deg` }],
          },
        ]}
      >
        {[-1, 1].map((side) => (
          <View
            key={`nub-${side}`}
            style={[
              styles.nub,
              {
                left: side < 0 ? 0 : (spriteW - NUB_W) * u,
                top: (NUB_TOP * fy + (side < 0 ? 0 : NUB_DROP)) * u,
                width: NUB_W * u,
                height: NUB_H * u,
                borderRadius: (NUB_H / 2) * u,
                borderWidth: INK * u,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.body,
            {
              left: NUB_OUT * u,
              top: 0,
              width: bodyW * u,
              height: bodyH * u,
            },
          ]}
        >
          <Svg
            width={bodyW * u}
            height={bodyH * u}
            viewBox={`0 0 ${BODY_W} ${BODY_H}`}
            preserveAspectRatio="none"
          >
            <Path
              d={BODY_PATH}
              fill={colors.roomBlob.body}
              stroke={colors.roomBlob.ink}
              strokeWidth={INK}
            />
          </Svg>
          {[-1, 1].map((side) => (
            <View
              key={`cheek-${side}`}
              style={[
                styles.cheek,
                {
                  left:
                    ((faceCenterX + side * CHEEK_DX - CHEEK_W / 2) * fx - INK) *
                    u,
                  top: (CHEEK_TOP * fy - INK) * u,
                  width: CHEEK_W * u,
                  height: CHEEK_H * u,
                  borderRadius: (CHEEK_H / 2) * u,
                },
              ]}
            />
          ))}

          {[-(face.eye.dx ?? EYE_DX), face.eye.dx ?? EYE_DX].map((offset) => {
            if (face.eye.chevron) {
              return (
                <ChevronEye
                  key={offset}
                  u={u}
                  eye={face.eye}
                  centerX={(faceCenterX + offset) * fx}
                  fy={fy}
                  pointsRight={offset < 0}
                />
              );
            }

            const squinted = face.squint === true && offset > 0;
            const h = squinted ? face.eye.h * 0.4 : face.eye.h;
            const top = squinted
              ? face.eye.top + (face.eye.h - h) / 2
              : face.eye.top;

            return (
              <View
                key={offset}
                style={[
                  styles.eye,
                  {
                    left:
                      ((faceCenterX + offset - face.eye.w / 2) * fx - INK) * u,
                    top: ((top - EYE_RISE) * fy - INK) * u,
                    width: face.eye.w * u,
                    height: h * u,
                    borderTopLeftRadius: (face.eye.w / 2) * u,
                    borderTopRightRadius: (face.eye.w / 2) * u,
                    borderBottomLeftRadius: face.eye.arc
                      ? 0
                      : (face.eye.w / 2) * u,
                    borderBottomRightRadius: face.eye.arc
                      ? 0
                      : (face.eye.w / 2) * u,
                  },
                ]}
              >
                {lid > 0 ? (
                  <View
                    style={[
                      styles.lid,
                      {
                        height: h * lid * u,
                        borderBottomLeftRadius: (face.eye.w / 2) * u,
                        borderBottomRightRadius: (face.eye.w / 2) * u,
                      },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}

          <View
            style={[
              styles.mouth,
              {
                left: ((faceCenterX - face.mouth.w / 2) * fx - INK) * u,
                top: ((face.mouth.top - MOUTH_RISE) * fy - INK) * u,
              },
            ]}
          >
            <MochiMouth
              kind={face.mouth.kind}
              w={face.mouth.w}
              h={face.mouth.h}
              u={u}
            />
          </View>

          {wearing === 'glasses' ? <Glasses u={u} fx={fx} fy={fy} /> : null}
        </View>
      </View>

      {holding === 'notes' ? <Notes u={u} width={width} /> : null}

      {wearing === 'headphones' ? (
        <Headphones u={u} width={width} crown={crown} />
      ) : null}
      {wearing === 'partyHat' ? (
        <PartyHat u={u} width={width} crown={crown} />
      ) : null}
      {wearing === 'nightcap' ? (
        <NightCap u={u} width={width} crown={crown} />
      ) : null}
    </View>
  );
}

export default memo(MochiPortrait);

/**
 * An eye screwed shut: a `>` on his left and a `<` on his right, so the pair
 * close in on each other.
 *
 * This is the one part of him that is not a rounded View. A chevron is a single
 * stroke that changes direction, and two Views butted together at the turn leave
 * the outside of the corner unfilled however carefully they are placed — so it is
 * drawn as one polyline with a round join, which is the shape a pen would make.
 * `react-native-svg` still scales with `size` and recolours from `colors.ts`.
 */
function ChevronEye({
  u,
  eye,
  centerX,
  fy,
  pointsRight,
}: {
  u: number;
  eye: EyeShape;
  /** the middle of this eye, in body units, already stretched */
  centerX: number;
  fy: number;
  pointsRight: boolean;
}) {
  /** the stroke straddles the path, so the box grows to hold its width and caps */
  const pad = EYE_STROKE;
  const boxW = eye.w + pad * 2;
  const boxH = eye.h + pad * 2;
  const tip = pointsRight ? pad + eye.w : pad;
  const back = pointsRight ? pad : pad + eye.w;

  return (
    <Svg
      style={{
        position: 'absolute',
        left: (centerX - boxW / 2 - INK) * u,
        top: ((eye.top - EYE_RISE - pad) * fy - INK) * u,
      }}
      width={boxW * u}
      height={boxH * fy * u}
      viewBox={`0 0 ${boxW} ${boxH}`}
      preserveAspectRatio="none"
    >
      <Polyline
        points={`${back},${pad} ${tip},${pad + eye.h / 2} ${back},${pad + eye.h}`}
        fill="none"
        stroke={colors.roomBlob.ink}
        strokeWidth={EYE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** rims around the eyes, a bridge between them and a stub arm on each side */
function Glasses({ u, fx, fy }: { u: number; fx: number; fy: number }) {
  /** the middle of the eye row he wears them over */
  const cy = 23;

  return (
    <>
      {[-EYE_DX, EYE_DX].map((offset) => (
        <View
          key={offset}
          style={[
            styles.lens,
            {
              left: ((FACE_CX + offset - LENS / 2) * fx - INK) * u,
              top: ((cy - LENS / 2) * fy - INK) * u,
              width: LENS * u,
              height: LENS * u,
              borderRadius: (LENS / 2) * u,
              borderWidth: RIM * u,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.frame,
          {
            left: ((FACE_CX - BRIDGE / 2) * fx - INK) * u,
            top: ((cy - RIM / 2) * fy - INK) * u,
            width: BRIDGE * u,
            height: RIM * u,
          },
        ]}
      />

      {[-1, 1].map((side) => (
        <View
          key={side}
          style={[
            styles.frame,
            {
              left:
                side < 0
                  ? ((FACE_CX - EYE_DX - LENS / 2 - 3.5) * fx - INK) * u
                  : ((FACE_CX + EYE_DX + LENS / 2 - 0.5) * fx - INK) * u,
              top: ((cy - RIM / 2) * fy - INK) * u,
              width: 4 * u,
              height: RIM * u,
            },
          ]}
        />
      ))}
    </>
  );
}

interface CrownProps {
  u: number;
  width: number;
  /** the top of his head, up from the bottom of the box */
  crown: number;
}

/** a band over the top of his head and a cup on each side */
function Headphones({ u, width, crown }: CrownProps) {
  return (
    <>
      {[-1, 1].map((side) => (
        <View
          key={side}
          style={[
            styles.cup,
            {
              left: width / 2 + (side * (BAND_W / 2 - 1) - CUP_W / 2) * u,
              bottom: crown - (BAND_H + CUP_H * 0.55) * u,
              width: CUP_W * u,
              height: CUP_H * u,
              borderRadius: (CUP_W / 2) * u,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.band,
          {
            left: (width - BAND_W * u) / 2,
            bottom: crown - BAND_H * u,
            width: BAND_W * u,
            height: BAND_H * u,
            borderTopLeftRadius: (BAND_W / 2) * u,
            borderTopRightRadius: (BAND_W / 2) * u,
            borderWidth: BAND_RIM * u,
            borderBottomWidth: 0,
          },
        ]}
      />
    </>
  );
}

/** a cone and a pom, for the screens that are congratulating him */
function PartyHat({ u, width, crown }: CrownProps) {
  return (
    <>
      <View
        style={{
          position: 'absolute',
          left: (width - HAT_W * u) / 2,
          bottom: crown - 3 * u,
          borderLeftWidth: (HAT_W / 2) * u,
          borderRightWidth: (HAT_W / 2) * u,
          borderBottomWidth: HAT_H * u,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.orange[400],
        }}
      />
      <View
        style={[
          styles.pom,
          {
            left: width / 2 - 3.5 * u,
            bottom: crown + (HAT_H - 5) * u,
            width: 7 * u,
            height: 7 * u,
            borderRadius: 3.5 * u,
          },
        ]}
      />
    </>
  );
}

/** a slumped cap and a pom, for the screens about sleep */
function NightCap({ u, width, crown }: CrownProps) {
  return (
    <>
      <View
        style={[
          styles.capBrim,
          {
            left: (width - CAP_W * u) / 2,
            bottom: crown - 4 * u,
            width: CAP_W * u,
            height: 6 * u,
            borderRadius: 3 * u,
          },
        ]}
      />
      <View
        style={[
          styles.cap,
          {
            left: width / 2 - 2 * u,
            bottom: crown - 1 * u,
            width: 11 * u,
            height: CAP_H * u,
            borderTopLeftRadius: 5.5 * u,
            borderTopRightRadius: 5.5 * u,
            borderBottomLeftRadius: 4 * u,
            borderBottomRightRadius: 4 * u,
            transform: [{ rotate: '28deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.pom,
          {
            left: width / 2 + 8 * u,
            bottom: crown + (CAP_H - 7) * u,
            width: 8 * u,
            height: 8 * u,
            borderRadius: 4 * u,
          },
        ]}
      />
    </>
  );
}

/** a stub of an arm at his side, and a pencil tilted out of it */
function Pencil({
  u,
  width,
  bodyW,
}: {
  u: number;
  width: number;
  bodyW: number;
}) {
  const shaft = PENCIL_H - 9;
  const armBottom = (SHADOW_H / 2 + BODY_LIFT + 14) * u;

  return (
    <>
      <View
        style={[
          styles.arm,
          {
            left: width / 2 + (bodyW / 2 - 6) * u,
            bottom: armBottom,
            width: 12 * u,
            height: 8 * u,
            borderRadius: 4 * u,
          },
        ]}
      />

      <View
        style={{
          position: 'absolute',
          left: width / 2 + 22 * u,
          bottom: armBottom - 2 * u,
          width: PENCIL_W * u,
          height: PENCIL_H * u,
          transform: [{ rotate: '35deg' }],
        }}
      >
        <View style={[styles.eraser, { height: 4 * u, borderRadius: 1.5 * u }]} />
        <View style={[styles.shaft, { top: 4 * u, height: shaft * u }]} />
        <View style={[styles.nib, { top: (4 + shaft) * u, height: 3 * u }]} />
        <View
          style={[
            styles.graphite,
            {
              top: (PENCIL_H - 2) * u,
              left: PENCIL_W * 0.25 * u,
              width: PENCIL_W * 0.5 * u,
              height: 2 * u,
            },
          ]}
        />
      </View>
    </>
  );
}

/**
 * The clipboard he takes an answer down on. It sits across his front, overlapping
 * his body, so the overlap alone reads as him holding it — the pencil arm at his
 * other side is the only limb he needs.
 */
function Notes({ u, width }: { u: number; width: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: width / 2 - (NOTES_W + 1) * u,
        bottom: (SHADOW_H / 2 + BODY_LIFT + 3) * u,
        width: NOTES_W * u,
        height: NOTES_H * u,
        transform: [{ rotate: '-6deg' }],
      }}
    >
      <View
        style={[
          styles.boardFace,
          { borderRadius: 2.5 * u, borderWidth: 1.4 * u },
        ]}
      />
      <View
        style={[
          styles.boardSpine,
          { left: NOTES_W * 0.62 * u, width: 1.4 * u },
        ]}
      />
    </View>
  );
}

/** a stub of an arm, and a book held open against it */
function Book({
  u,
  width,
  bodyW,
}: {
  u: number;
  width: number;
  bodyW: number;
}) {
  const bottom = (SHADOW_H / 2 + BODY_LIFT + 8) * u;

  return (
    <>
      <View
        style={[
          styles.arm,
          {
            left: width / 2 + (bodyW / 2 - 6) * u,
            bottom: bottom + 6 * u,
            width: 12 * u,
            height: 8 * u,
            borderRadius: 4 * u,
          },
        ]}
      />

      <View
        style={{
          position: 'absolute',
          left: width / 2 + 16 * u,
          bottom,
          width: BOOK_W * u,
          height: BOOK_H * u,
          transform: [{ rotate: '-10deg' }],
        }}
      >
        <View
          style={[
            styles.bookCover,
            { borderRadius: 2 * u, borderWidth: 1.4 * u },
          ]}
        />
        <View
          style={[
            styles.bookSpine,
            { left: BOOK_W * 0.5 * u - 0.7 * u, width: 1.4 * u },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', backgroundColor: colors.roomBlob.shadow },
  // Same fill and same ink as the body, drawn before it so his outline runs
  // across their tops and only the bean end shows.
  foot: {
    position: 'absolute',
    backgroundColor: colors.roomBlob.body,
    borderColor: colors.roomBlob.ink,
  },
  // Hinged at the floor, so a lean reads as a bend at the waist rather than the
  // whole sprite falling over. Carries the nubs as well as the body, so the
  // three lean as one creature.
  sprite: {
    position: 'absolute',
    transformOrigin: 'bottom center',
  },
  nub: {
    position: 'absolute',
    backgroundColor: colors.roomBlob.body,
    borderColor: colors.roomBlob.ink,
  },
  body: {
    position: 'absolute',
  },
  eye: {
    position: 'absolute',
    backgroundColor: colors.roomBlob.ink,
    overflow: 'hidden',
  },
  // His own colour sliding down over the eye, clipped to it. Half-shut eyes are
  // the cheapest tired, sceptical or sad there is.
  lid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.roomBlob.body,
  },
  mouth: { position: 'absolute' },
  cheek: { position: 'absolute', backgroundColor: colors.roomBlob.cheek },
  lens: {
    position: 'absolute',
    borderColor: colors.roomBlob.ink,
  },
  frame: { position: 'absolute', backgroundColor: colors.roomBlob.ink },
  band: {
    position: 'absolute',
    borderColor: colors.neutral[700],
    backgroundColor: 'transparent',
  },
  cup: { position: 'absolute', backgroundColor: colors.neutral[700] },
  arm: { position: 'absolute', backgroundColor: colors.neutral[700] },
  pom: { position: 'absolute', backgroundColor: colors.neutral[0] },
  cap: { position: 'absolute', backgroundColor: colors.primary.blue600 },
  capBrim: { position: 'absolute', backgroundColor: colors.neutral[0] },
  eraser: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.orange[200],
  },
  shaft: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.orange[400],
  },
  nib: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.orange[600],
  },
  graphite: { position: 'absolute', backgroundColor: colors.roomBlob.ink },
  bookCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary.blue200,
    borderColor: colors.primary.blue600,
  },
  bookSpine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary.blue600,
  },
  boardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.roomBlob.board,
    borderColor: colors.roomBlob.boardEdge,
  },
  boardSpine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.roomBlob.boardEdge,
  },
});
