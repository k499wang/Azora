import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Confetti from '../common/Confetti';
import CelebrationToast from '../common/CelebrationToast';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

/**
 * Where a celebration goes off: one fixed point above the tab bar, whatever it
 * is celebrating and wherever on the page that happened. A burst that moves to
 * the row it belongs to has to be found; this one is always in the same place,
 * so it reads as the app cheering rather than as part of the list.
 */
const CELEBRATION_LIFT = 120;
const CELEBRATION_PIECES = 34;
const CELEBRATION_PIECE_SCALE = 1.9;
// Two bursts off the same point: the second lands while the first is still in
// the air, so it reads as a pop-pop rather than as one burst played twice.
const CELEBRATION_SECOND_DELAY_MS = 240;
const CELEBRATION_MS = 1800;
const CELEBRATION_COLORS = [
  colors.primary.blue600,
  colors.success[500],
] as const;
/** clear of the tab bar without floating away from it */
const TOAST_LIFT = spacing.sm;
const TOAST_TITLE = 'Nice work!';

export interface HomeCelebrationHandle {
  /** the burst, for something that finished without a place of its own to fire from */
  burst: () => void;
  /** the bar, for anything worth confirming by name */
  confirm: (detail: string) => void;
}

interface HomeCelebrationLayerProps {
  /** how far off the bottom of the screen the tab bar reaches */
  tabBarHeight: number;
}

/**
 * Home's celebrations, kept behind an imperative handle rather than state on
 * the screen.
 *
 * A to-do landing used to set state on `HomeScreen`, which re-rendered the room
 * and every list under it — a few hundred views of React work committed on the
 * exact frame the burst was trying to start on, which is what made it stutter
 * out of the gate. Firing through a ref re-renders this layer alone, so the
 * animation starts on an idle thread.
 */
const HomeCelebrationLayer = forwardRef<
  HomeCelebrationHandle,
  HomeCelebrationLayerProps
>(function HomeCelebrationLayer({ tabBarHeight }, ref) {
  // The changing key remounts the burst, so two celebrations in a row play
  // twice rather than once.
  const [celebration, setCelebration] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; detail: string } | null>(
    null,
  );

  useImperativeHandle(
    ref,
    () => ({
      burst: () => setCelebration(Date.now()),
      confirm: (detail: string) => setToast({ id: Date.now(), detail }),
    }),
    [],
  );

  useEffect(() => {
    if (celebration == null) return;
    const timer = setTimeout(() => setCelebration(null), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebration]);

  return (
    <>
      {celebration == null ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.celebration,
            { bottom: tabBarHeight + CELEBRATION_LIFT },
          ]}
        >
          <Confetti
            key={celebration}
            pieceColors={CELEBRATION_COLORS}
            pieceCount={CELEBRATION_PIECES}
            pieceScale={CELEBRATION_PIECE_SCALE}
          />
          <Confetti
            key={`${celebration}-second`}
            pieceColors={CELEBRATION_COLORS}
            pieceCount={CELEBRATION_PIECES}
            pieceScale={CELEBRATION_PIECE_SCALE * 0.8}
            startDelayMs={CELEBRATION_SECOND_DELAY_MS}
          />
        </View>
      )}

      {toast == null ? null : (
        <View
          pointerEvents="none"
          style={[styles.toast, { bottom: tabBarHeight + TOAST_LIFT }]}
        >
          <CelebrationToast
            key={toast.id}
            title={TOAST_TITLE}
            detail={toast.detail === '' ? undefined : toast.detail}
            onDone={() => setToast(null)}
          />
        </View>
      )}
    </>
  );
});

export default HomeCelebrationLayer;

const styles = StyleSheet.create({
  // Zero-height and centred: the burst radiates from this point, so the layer
  // itself only has to say where that point is.
  celebration: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
