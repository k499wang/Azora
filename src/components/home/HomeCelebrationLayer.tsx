import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Confetti from '../common/Confetti';
import { loadBackgroundImage } from '../../services/images/backgroundImageCache';
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
  colors.primary.blue500,
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
  /**
   * A standing bar for the same slot — an offer waiting to be answered. The
   * slot holds one bar at a time, so this one goes when the app has something
   * of its own to say.
   */
  notice?: ReactNode;
  /** the notice was pushed aside by a confirmation */
  onNoticePreempted?: () => void;
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
>(function HomeCelebrationLayer(
  { tabBarHeight, notice, onNoticePreempted },
  ref,
) {
  // The changing key remounts the burst, so two celebrations in a row play
  // twice rather than once.
  const [celebration, setCelebration] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; detail: string } | null>(
    null,
  );

  // The handle is built once, so what it needs from the current render is read
  // through a ref rather than rebuilding the handle on every notice change.
  const preempt = useRef<(() => void) | undefined>(undefined);
  preempt.current = notice == null ? undefined : onNoticePreempted;

  useImperativeHandle(
    ref,
    () => ({
      burst: () => {
        preempt.current?.();
        setCelebration(Date.now());
      },
      confirm: (detail: string) => {
        preempt.current?.();
        setToast({ id: Date.now(), detail });
      },
    }),
    [],
  );

  // The bar carries the streak flame, and the flame is a PNG that is not in
  // the startup set. Left alone it is decoded the first time something on Home
  // is worth confirming — which is the frame the bar is trying to spring in on,
  // and the decode lands in the middle of it. Warmed with the screen instead,
  // so the bar has nothing to wait for.
  useEffect(() => {
    void loadBackgroundImage('streakFlame').catch(() => {});
  }, []);

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
          style={[styles.bar, { bottom: tabBarHeight + TOAST_LIFT }]}
        >
          <CelebrationToast
            key={toast.id}
            title={TOAST_TITLE}
            detail={toast.detail === '' ? undefined : toast.detail}
            onDone={() => setToast(null)}
          />
        </View>
      )}

      {notice == null || toast != null ? null : (
        <View style={[styles.bar, { bottom: tabBarHeight + TOAST_LIFT }]}>
          {notice}
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
  // The one slot at the bottom of the page, shared by the confirmation bar and
  // any standing notice.
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
