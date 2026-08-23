import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

/**
 * Mochi cropped to his face, standing on a pair of feet.
 *
 * `MochiPortrait` draws the whole character — a lean, a stance, the ground
 * shadow he stands on. This is the app-icon crop: one shape, straight on, and
 * nothing else. It exists for the places where he is the frame rather than
 * someone standing in it, which today means the sign-in landing.
 *
 * His feet stay square under him rather than taking the portrait's uneven
 * stance. Off-centre feet are what stop him reading as a mannequin when he is
 * standing in a room; centred under a wordmark they only look like he is about
 * to tip over.
 *
 * Cheeks are the one thing here he does not have anywhere else. At this size the
 * face carries the whole screen, and a mint blob with two eyes reads as a shape
 * rather than a character without them.
 *
 * The constants below mirror `MochiPortrait`'s deliberately rather than
 * importing them, which is the same arrangement `MochiPortrait` has with
 * `RoomBlob`: each renderer measures in its own basis and keeps its own numbers
 * legible in one file.
 */
const BODY_W = 54;
const BODY_H = 48;
/** how far his bottom corners are rounded off, in body units */
const BODY_ROUND = 22;
/** how far he floats above his feet, which is what lets them show below him */
const BODY_LIFT = 6;

const FOOT_W = 19;
const FOOT_H = 9.5;
const FOOT_X = 13;

/** straight on, so the face is centred rather than carrying his usual offset */
const FACE_CX = BODY_W / 2;
const EYE_DX = 8.5;
const EYE_W = 9;
const EYE_H = 10;
const EYE_TOP = 15;

const MOUTH_W = 12;
const MOUTH_H = 6;
const MOUTH_TOP = 30;

const CHEEK_R = 5;
const CHEEK_DX = 16.5;
const CHEEK_TOP = 24;

const SHEEN_LEFT = 9.5;
const SHEEN_TOP = 7;
const SHEEN_W = 20;
const SHEEN_H = 15;

interface MochiFaceProps {
  /** rendered width of his face; everything else scales from it */
  size: number;
}

function MochiFace({ size }: MochiFaceProps) {
  const u = size / BODY_W;

  return (
    <View style={{ width: BODY_W * u, height: (BODY_H + BODY_LIFT) * u }}>
      {[-FOOT_X, FOOT_X].map((offset) => (
        <View
          key={`foot-${offset}`}
          style={[
            styles.foot,
            {
              left: (FACE_CX + offset - FOOT_W / 2) * u,
              width: FOOT_W * u,
              height: FOOT_H * u,
              borderRadius: (FOOT_H / 2) * u,
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.face,
          {
            bottom: BODY_LIFT * u,
            width: BODY_W * u,
            height: BODY_H * u,
            borderTopLeftRadius: (BODY_W / 2) * u,
            borderTopRightRadius: (BODY_W / 2) * u,
            borderBottomLeftRadius: BODY_ROUND * u,
            borderBottomRightRadius: BODY_ROUND * u,
          },
        ]}
      >
        <View
          style={[
            styles.sheen,
            {
              left: SHEEN_LEFT * u,
              top: SHEEN_TOP * u,
              width: SHEEN_W * u,
              height: SHEEN_H * u,
              borderRadius: (SHEEN_W / 2) * u,
            },
          ]}
        />

        {[-1, 1].map((side) => (
          <View
            key={`cheek-${side}`}
            style={[
              styles.cheek,
              {
                left: (FACE_CX + side * CHEEK_DX - CHEEK_R) * u,
                top: CHEEK_TOP * u,
                width: CHEEK_R * 2 * u,
                height: CHEEK_R * 2 * u,
                borderRadius: CHEEK_R * u,
              },
            ]}
          />
        ))}

        {[-EYE_DX, EYE_DX].map((offset) => (
          <View
            key={`eye-${offset}`}
            style={[
              styles.eye,
              {
                left: (FACE_CX + offset - EYE_W / 2) * u,
                top: EYE_TOP * u,
                width: EYE_W * u,
                height: EYE_H * u,
                borderRadius: (EYE_W / 2) * u,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.mouth,
            {
              left: (FACE_CX - MOUTH_W / 2) * u,
              top: MOUTH_TOP * u,
              width: MOUTH_W * u,
              height: MOUTH_H * u,
              borderBottomLeftRadius: MOUTH_H * u,
              borderBottomRightRadius: MOUTH_H * u,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foot: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.roomBlob.foot,
  },
  // Clips the sheen, cheeks and mouth to his silhouette, so each one can stay a
  // plain rectangle placed by its own numbers.
  face: {
    position: 'absolute',
    left: 0,
    backgroundColor: colors.roomBlob.body,
    overflow: 'hidden',
  },
  sheen: { position: 'absolute', backgroundColor: colors.roomBlob.bodyLight },
  cheek: { position: 'absolute', backgroundColor: colors.roomBlob.cheek },
  eye: { position: 'absolute', backgroundColor: colors.roomBlob.face },
  mouth: {
    position: 'absolute',
    backgroundColor: colors.roomBlob.face,
    opacity: 0.75,
  },
});

// Its only prop is a number and its output is a static View tree, so without
// this it redraws on every parent render for no change on screen.
export default memo(MochiFace);
