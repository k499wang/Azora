import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

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
const BODY_W = 54;
const BODY_H = 48;
const BODY_LIFT = 6;
const FOOT_W = 19;
const FOOT_H = 9.5;
const FOOT_X = 13;
const SHADOW_W = 60;
const SHADOW_H = 20;
const EYE_SHIFT = 2.5;
const EYE_DX = 8;

/** the centre of the face, in body units */
const FACE_CX = BODY_W / 2 + EYE_SHIFT;

/**
 * How he is feeling.
 *
 * The face is the cheapest thing to vary and the thing that carries the most —
 * one blob with seven expressions reads as a character, where seven differently
 * shaped blobs read as seven mascots.
 */
export type MochiExpression =
  | 'happy'
  | 'sad'
  | 'sleepy'
  | 'excited'
  | 'thinking'
  | 'surprised'
  | 'proud';

/**
 * What he is wearing or holding.
 *
 * Pick one per screen — he reads as a character with a prop, not a dress-up
 * doll. Props that need room above or beside him grow the sprite's box rather
 * than spilling out of it: Android clips children that overflow their parent,
 * so anything poking outside the bounds would render on iOS and be cut off on
 * Android.
 */
export type MochiAccessory =
  | 'glasses'
  | 'pencil'
  | 'headphones'
  | 'book'
  | 'partyHat'
  | 'nightcap';

interface EyeShape {
  w: number;
  h: number;
  top: number;
  /** rounds only the top edge, for the closed happy arc */
  arc?: boolean;
}

type MouthKind = 'smile' | 'frown' | 'open' | 'line';

interface MouthShape {
  w: number;
  h: number;
  top: number;
  kind: MouthKind;
}

interface Face {
  eye: EyeShape;
  mouth: MouthShape;
  /** squints the far eye, for a look off to one side */
  squint?: boolean;
}

const FACES: Record<MochiExpression, Face> = {
  happy: {
    eye: { w: 8, h: 9, top: 16 },
    mouth: { w: 11, h: 5.5, top: 31, kind: 'smile' },
  },
  sad: {
    eye: { w: 8, h: 5.5, top: 18 },
    mouth: { w: 9, h: 4.5, top: 33, kind: 'frown' },
  },
  sleepy: {
    eye: { w: 9, h: 2.2, top: 20 },
    mouth: { w: 6, h: 3, top: 32, kind: 'smile' },
  },
  excited: {
    eye: { w: 9, h: 10, top: 15 },
    mouth: { w: 12, h: 9, top: 28, kind: 'open' },
  },
  thinking: {
    eye: { w: 8, h: 9, top: 16 },
    mouth: { w: 7, h: 2.2, top: 33, kind: 'line' },
    squint: true,
  },
  surprised: {
    eye: { w: 10, h: 11, top: 14 },
    mouth: { w: 7, h: 7.5, top: 30, kind: 'open' },
  },
  proud: {
    eye: { w: 9, h: 4.5, top: 18, arc: true },
    mouth: { w: 13, h: 6.5, top: 30, kind: 'smile' },
  },
};

/** extra room a prop needs above his head, in body units */
const HEADROOM: Record<MochiAccessory, number> = {
  glasses: 0,
  pencil: 0,
  headphones: 3,
  book: 0,
  partyHat: 17,
  nightcap: 15,
};

/** extra room a prop needs on either side, in body units */
const SIDEROOM: Record<MochiAccessory, number> = {
  glasses: 0,
  pencil: 8,
  headphones: 0,
  book: 10,
  partyHat: 0,
  nightcap: 4,
};

const LENS = 13;
const RIM = 1.8;
const BAND_W = 52;
const BAND_H = 17;
const BAND_RIM = 3;
const CUP_W = 9;
const CUP_H = 13;
const PENCIL_W = 5;
const PENCIL_H = 28;
const BOOK_W = 22;
const BOOK_H = 17;
const HAT_W = 22;
const HAT_H = 20;
const CAP_W = 26;
const CAP_H = 20;

interface MochiPortraitProps {
  /** rendered width of the body; everything else scales from it */
  size: number;
  expression?: MochiExpression;
  accessory?: MochiAccessory;
}

function MochiPortrait({
  size,
  expression = 'happy',
  accessory,
}: MochiPortraitProps) {
  const u = size / BODY_W;
  const headroom = accessory ? HEADROOM[accessory] : 0;
  const sideroom = accessory ? SIDEROOM[accessory] : 0;
  const width = (SHADOW_W + sideroom * 2) * u;
  const height = (BODY_H + BODY_LIFT + SHADOW_H + headroom) * u;
  /** the floor line, measured up from the bottom of the box */
  const contact = (SHADOW_H / 2) * u;
  /** the top of his head, measured up from the bottom of the box */
  const crown = contact + (BODY_LIFT + BODY_H) * u;
  const face = FACES[expression];

  return (
    <View style={{ width, height }}>
      <View
        style={[
          styles.shadow,
          {
            left: (width - SHADOW_W * u) / 2,
            bottom: 0,
            width: SHADOW_W * u,
            height: SHADOW_H * u,
            borderRadius: (SHADOW_H / 2) * u,
          },
        ]}
      />

      {[-FOOT_X, FOOT_X].map((offset) => (
        <View
          key={offset}
          style={[
            styles.foot,
            {
              left: width / 2 + (offset - FOOT_W / 2) * u,
              bottom: contact,
              width: FOOT_W * u,
              height: FOOT_H * u,
              borderRadius: (FOOT_H / 2) * u,
            },
          ]}
        />
      ))}

      {accessory === 'book' ? <Book u={u} width={width} /> : null}
      {accessory === 'pencil' ? <Pencil u={u} width={width} /> : null}

      <View
        style={[
          styles.body,
          {
            left: (width - BODY_W * u) / 2,
            bottom: contact + BODY_LIFT * u,
            width: BODY_W * u,
            height: BODY_H * u,
            borderTopLeftRadius: (BODY_W / 2) * u,
            borderTopRightRadius: (BODY_W / 2) * u,
            borderBottomLeftRadius: 22 * u,
            borderBottomRightRadius: 22 * u,
          },
        ]}
      >
        <View
          style={[
            styles.sheen,
            {
              left: 9.5 * u,
              top: 7 * u,
              width: 20 * u,
              height: 15 * u,
              borderRadius: 10 * u,
            },
          ]}
        />

        {[-EYE_DX, EYE_DX].map((offset) => {
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
                  left: (FACE_CX + offset - face.eye.w / 2) * u,
                  top: top * u,
                  width: face.eye.w * u,
                  height: h * u,
                  borderTopLeftRadius: (face.eye.w / 2) * u,
                  borderTopRightRadius: (face.eye.w / 2) * u,
                  borderBottomLeftRadius: face.eye.arc ? 0 : (face.eye.w / 2) * u,
                  borderBottomRightRadius: face.eye.arc
                    ? 0
                    : (face.eye.w / 2) * u,
                },
              ]}
            />
          );
        })}

        <Mouth mouth={face.mouth} u={u} />

        {accessory === 'glasses' ? <Glasses u={u} /> : null}
      </View>

      {accessory === 'headphones' ? (
        <Headphones u={u} width={width} crown={crown} />
      ) : null}
      {accessory === 'partyHat' ? (
        <PartyHat u={u} width={width} crown={crown} />
      ) : null}
      {accessory === 'nightcap' ? (
        <NightCap u={u} width={width} crown={crown} />
      ) : null}
    </View>
  );
}

export default memo(MochiPortrait);

function Mouth({ mouth, u }: { mouth: MouthShape; u: number }) {
  const round = (value: number) => value * u;
  const corners =
    mouth.kind === 'smile'
      ? {
          borderBottomLeftRadius: round(mouth.h),
          borderBottomRightRadius: round(mouth.h),
        }
      : mouth.kind === 'frown'
        ? {
            borderTopLeftRadius: round(mouth.h),
            borderTopRightRadius: round(mouth.h),
          }
        : { borderRadius: round(Math.min(mouth.w, mouth.h) / 2) };

  return (
    <View
      style={[
        styles.mouth,
        {
          left: (FACE_CX - mouth.w / 2) * u,
          top: mouth.top * u,
          width: mouth.w * u,
          height: mouth.h * u,
        },
        corners,
      ]}
    />
  );
}

/** rims around the eyes, a bridge between them and a stub arm on each side */
function Glasses({ u }: { u: number }) {
  const cy = 20.5;

  return (
    <>
      {[-EYE_DX, EYE_DX].map((offset) => (
        <View
          key={offset}
          style={[
            styles.lens,
            {
              left: (FACE_CX + offset - LENS / 2) * u,
              top: (cy - LENS / 2) * u,
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
            left: (FACE_CX - EYE_DX + LENS / 2 - 0.5) * u,
            top: (cy - RIM / 2) * u,
            width: (2 * EYE_DX - LENS + 1) * u,
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
                  ? (FACE_CX - EYE_DX - LENS / 2 - 3.5) * u
                  : (FACE_CX + EYE_DX + LENS / 2 - 0.5) * u,
              top: (cy - RIM / 2) * u,
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
function Pencil({ u, width }: { u: number; width: number }) {
  const shaft = PENCIL_H - 9;
  const armBottom = (SHADOW_H / 2 + BODY_LIFT + 14) * u;

  return (
    <>
      <View
        style={[
          styles.arm,
          {
            left: width / 2 + (BODY_W / 2 - 6) * u,
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

/** a stub of an arm, and a book held open against it */
function Book({ u, width }: { u: number; width: number }) {
  const bottom = (SHADOW_H / 2 + BODY_LIFT + 8) * u;

  return (
    <>
      <View
        style={[
          styles.arm,
          {
            left: width / 2 + (BODY_W / 2 - 6) * u,
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
  foot: { position: 'absolute', backgroundColor: colors.roomBlob.foot },
  body: { position: 'absolute', backgroundColor: colors.roomBlob.body },
  sheen: { position: 'absolute', backgroundColor: colors.roomBlob.bodyLight },
  eye: { position: 'absolute', backgroundColor: colors.roomBlob.face },
  mouth: {
    position: 'absolute',
    backgroundColor: colors.roomBlob.face,
    opacity: 0.75,
  },
  lens: {
    position: 'absolute',
    borderColor: colors.roomBlob.face,
  },
  frame: { position: 'absolute', backgroundColor: colors.roomBlob.face },
  band: {
    position: 'absolute',
    borderColor: colors.neutral[700],
    backgroundColor: 'transparent',
  },
  cup: { position: 'absolute', backgroundColor: colors.neutral[700] },
  arm: { position: 'absolute', backgroundColor: colors.roomBlob.foot },
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
  graphite: { position: 'absolute', backgroundColor: colors.roomBlob.face },
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
});
