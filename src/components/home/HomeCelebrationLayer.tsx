import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Confetti, { type ConfettiHandle } from '../common/Confetti';
import { loadBackgroundImage } from '../../services/images/backgroundImageCache';
import CelebrationToast from '../common/CelebrationToast';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';

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
const TOAST_TITLES = [
  'Nice work!',
  'A little win!',
  'You showed up!',
  'One step forward!',
  'Look at you go!',
  'That counts!',
  'You made time!',
  'Small steps add up!',
  'A moment for you!',
  'Keep growing!',
  'Well done, you!',
  'Progress made!',
  'A promise kept!',
  'One more win!',
  'Good things build!',
  'You did it!',
] as const;
/** the latest the burst is built, should the screen never go idle first */
const ARM_TIMEOUT_MS = 600;
/** how long the bar stays up; a new tick restarts it */
const TOAST_HOLD_MS = 2200;
// The confetti flight plus its final piece's stagger.
const BURST_LIFETIME_MS = 2720;

export interface HomeCelebrationHandle {
  /** the burst, for something that finished without a place of its own to fire from */
  burst: () => void;
  /** the bar, for anything worth confirming by name */
  confirm: (detail: string) => void;
}

interface HomeCelebrationLayerProps {
  /** how far off the bottom of the screen the tab bar reaches */
  tabBarHeight: number;
  /** Stop local celebrations while a full-screen reward covers Home. */
  active?: boolean;
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
  { tabBarHeight, active = true, notice, onNoticePreempted },
  ref,
) {
  // Two canvases, mounted with the screen and fired in turn, so firing costs a
  // clock restart rather than building Skia scenes on the frame the tap lands.
  // A fall outlasts a quick run of ticks, and taking turns lets the last burst
  // finish falling while the next one goes up instead of being cut off.
  const confetti = useRef<(ConfettiHandle | null)[]>([null, null]);
  const busyUntil = useRef([0, 0]);
  const visible = useRef(false);
  // Built once the screen has finished arriving rather than on the frame it
  // appears: two Skia canvases, their scenes and the toast's image are work
  // the first paint has no use for. An early tick gets its immediate check
  // and confirmation without building both canvases on that interaction.
  const [armed, setArmed] = useState(false);
  const prepared = useRef(false);
  const ready = useRef(armed);
  ready.current = armed;
  const [toast, setToast] = useState({ id: 0, title: '', detail: '', visible: false });
  const lastToastTitleIndex = useRef(-1);
  const toastGeneration = useRef(0);
  const cancelToastTimer = useRef<(() => void) | null>(null);
  useWhileVisible(() => {
    if (!active) return () => {};
    visible.current = true;
    const idle = prepared.current ? null : requestIdleCallback(() => {
      prepared.current = true;
      setArmed(true);
    }, { timeout: ARM_TIMEOUT_MS });
    return () => {
      if (idle != null) cancelIdleCallback(idle);
      visible.current = false;
      toastGeneration.current += 1;
      cancelToastTimer.current?.();
      cancelToastTimer.current = null;
      busyUntil.current = [0, 0];
      confetti.current.forEach((canvas) => canvas?.stop());
      setToast((current) => ({ ...current, visible: false }));
    };
  }, [active]);

  // The handle is built once, so what it needs from the current render is read
  // through a ref rather than rebuilding the handle on every notice change.
  const preempt = useRef<(() => void) | undefined>(undefined);
  preempt.current = notice == null ? undefined : onNoticePreempted;

  useImperativeHandle(
    ref,
    () => ({
      burst: () => {
        if (!visible.current || !ready.current) return;
        preempt.current?.();
        const now = Date.now();
        const slot = busyUntil.current.findIndex((until) => until <= now);
        if (slot === -1) return;
        busyUntil.current[slot] = now + BURST_LIFETIME_MS;
        confetti.current[slot]?.fire();
      },
      confirm: (detail: string) => {
        if (!visible.current) return;
        preempt.current?.();
        const id = ++toastGeneration.current;
        cancelToastTimer.current?.();
        // Start the lifetime with the confirmation, even if React is busy
        // committing the activity update. A stale callback cannot hide a newer
        // tick. Timed on the frame clock: a JS timer this long could be parked
        // until the next touch, holding the bar up.
        cancelToastTimer.current = startUiTimer(TOAST_HOLD_MS, () => {
          if (toastGeneration.current !== id) return;
          cancelToastTimer.current = null;
          setToast((current) => ({ ...current, visible: false }));
        });
        const previousTitleIndex = lastToastTitleIndex.current;
        const choiceCount = TOAST_TITLES.length - (previousTitleIndex === -1 ? 0 : 1);
        let titleIndex = Math.floor(Math.random() * choiceCount);
        // Skip the previous title without allocating a filtered list or retrying.
        if (previousTitleIndex !== -1 && titleIndex >= previousTitleIndex) titleIndex += 1;
        lastToastTitleIndex.current = titleIndex;
        setToast({ id, title: TOAST_TITLES[titleIndex], detail, visible: true });
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

  const built = armed || toast.visible;

  return (
    <>
      {!armed ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.celebration,
            { bottom: tabBarHeight + CELEBRATION_LIFT },
          ]}
        >
          <Confetti
            ref={(canvas) => {
              confetti.current[0] = canvas;
            }}
            active={false}
            pieceColors={CELEBRATION_COLORS}
            pieceCount={CELEBRATION_PIECES}
            pieceScale={CELEBRATION_PIECE_SCALE}
          />
          <Confetti
            ref={(canvas) => {
              confetti.current[1] = canvas;
            }}
            active={false}
            pieceColors={CELEBRATION_COLORS}
            pieceCount={CELEBRATION_PIECES}
            pieceScale={CELEBRATION_PIECE_SCALE}
          />
        </View>
      )}

      {/* Keep the owner mounted once built. The toast removes its hidden bar
          so stale native opacity cannot expose a previous confirmation. */}
      {!built ? null : (
        <View
          pointerEvents="none"
          style={[styles.bar, { bottom: tabBarHeight + TOAST_LIFT }]}
        >
          <CelebrationToast
            title={toast.title}
            detail={toast.detail === '' ? undefined : toast.detail}
            visible={active && toast.visible}
          />
        </View>
      )}

      {!active || notice == null || toast.visible ? null : (
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
