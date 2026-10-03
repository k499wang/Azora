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
const CELEBRATION_PIECE_SCALE = 1.6;
const CELEBRATION_COLORS = [
  colors.primary.blue500,
  colors.success[500],
] as const;
/** clear of the tab bar without floating away from it */
const TOAST_LIFT = spacing.sm;
const TOAST_TITLE = 'Nice work!';
/** the latest the burst is built, should the screen never go idle first */
const ARM_TIMEOUT_MS = 600;
/** how long the bar stays up; a new tick restarts it */
const TOAST_HOLD_MS = 2200;

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
  // Two canvases, mounted with the screen and fired in turn, so firing costs a
  // clock restart rather than building Skia scenes on the frame the tap lands.
  // A fall outlasts a quick run of ticks, and taking turns lets the last burst
  // finish falling while the next one goes up instead of being cut off.
  const [bursts, setBursts] = useState(0);
  // Built once the screen has finished arriving rather than on the frame it
  // appears: two Skia canvases, their scenes and the toast's image are work
  // the first paint has no use for, and a tick is never that quick. One that
  // is still gets its burst — asking for one builds them on the spot.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const handle = requestIdleCallback(() => setArmed(true), {
      timeout: ARM_TIMEOUT_MS,
    });
    return () => cancelIdleCallback(handle);
  }, []);
  const [toast, setToast] = useState({ id: 0, detail: '', visible: false });
  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(
      () => setToast((current) => ({ ...current, visible: false })),
      TOAST_HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.visible]);

  // The handle is built once, so what it needs from the current render is read
  // through a ref rather than rebuilding the handle on every notice change.
  const preempt = useRef<(() => void) | undefined>(undefined);
  preempt.current = notice == null ? undefined : onNoticePreempted;

  useImperativeHandle(
    ref,
    () => ({
      burst: () => {
        preempt.current?.();
        setBursts((count) => count + 1);
      },
      confirm: (detail: string) => {
        preempt.current?.();
        setToast((current) => ({ id: current.id + 1, detail, visible: true }));
      },
    }),
    [],
  );

  // The bar carries the streak flame, and the flame is a PNG that is not in
  // the startup set. Left alone it is decoded the first time something on Home
  // is worth confirming — which is the frame the confetti is launching on,
  // and the decode lands in the middle of it. Warmed with the screen instead,
  // so the bar has nothing to wait for.
  useEffect(() => {
    void loadBackgroundImage('streakFlame').catch(() => {});
  }, []);

  const built = armed || bursts > 0 || toast.visible;

  return (
    <>
      {!built ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.celebration,
            { bottom: tabBarHeight + CELEBRATION_LIFT },
          ]}
        >
          <Confetti
            active={bursts >= 1}
            shot={Math.ceil(bursts / 2)}
            pieceColors={CELEBRATION_COLORS}
            pieceCount={CELEBRATION_PIECES}
            pieceScale={CELEBRATION_PIECE_SCALE}
          />
          <Confetti
            active={bursts >= 2}
            shot={Math.floor(bursts / 2)}
            pieceColors={CELEBRATION_COLORS}
            pieceCount={CELEBRATION_PIECES}
            pieceScale={CELEBRATION_PIECE_SCALE}
          />
        </View>
      )}

      {/* Kept mounted once built and only ever shown or hidden, so a tick
          builds nothing on the frame the burst launches on. */}
      {!built ? null : (
        <View
          pointerEvents="none"
          style={[styles.bar, { bottom: tabBarHeight + TOAST_LIFT }]}
        >
          <CelebrationToast
            title={TOAST_TITLE}
            detail={toast.detail === '' ? undefined : toast.detail}
            visible={toast.visible}
          />
        </View>
      )}

      {notice == null || toast.visible ? null : (
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
