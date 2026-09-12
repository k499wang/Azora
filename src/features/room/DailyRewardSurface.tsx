import { createContext, useContext, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

/**
 * The one screen the whole reward happens on.
 *
 * The celebration and the decorating stage were a native modal each, and the
 * handover between them had no good answer. Swapping one for the other left a
 * frame or two with neither presented and the screen behind them showing
 * through. Overlapping them was worse: the stage presents *on top of* the
 * sheet, so unmounting the sheet underneath took the stage down with it — iOS
 * tears down whatever a dismissing controller was presenting — and what was
 * left was an untouchable screen.
 *
 * Both are content of this one presentation instead. Handing over is then a
 * cross-fade between two views, which nothing can tear down and which no frame
 * can fall through.
 */

const Presented = createContext(false);

/** True once the surface's modal is actually on screen. */
export function useSurfacePresented(): boolean {
  return useContext(Presented);
}

interface Props {
  visible: boolean;
  children: ReactNode;
}

export default function DailyRewardSurface({ visible, children }: Props) {
  const [presented, setPresented] = useState(false);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      // Every entrance inside here is driven in JS, so the platform must not
      // animate the presentation underneath them.
      animationType="none"
      statusBarTranslucent
      // Android's back gesture must not dismiss the reward.
      onRequestClose={() => {}}
      onShow={() => setPresented(true)}
    >
      <Presented.Provider value={presented}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </Presented.Provider>
    </Modal>
  );
}
