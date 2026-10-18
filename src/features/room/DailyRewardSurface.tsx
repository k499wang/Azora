import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';

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
  onShow?: () => void;
  onDismiss?: () => void;
  children: ReactNode;
}

// Keep the host mounted while visible becomes false: unmounting it loses the
// native dismissal callback and can race the next popup.
export default function DailyRewardSurface({ visible, onShow, onDismiss, children }: Props) {
  const [presented, setPresented] = useState(false);

  useEffect(() => {
    if (visible) return;
    setPresented(false);
    // Android removes the dialog when visible changes; its Modal has no
    // onDismiss event. iOS must finish dismissing before another modal opens.
    if (Platform.OS !== 'ios') onDismiss?.();
  }, [visible, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
      onShow={() => {
        setPresented(true);
        onShow?.();
      }}
      onDismiss={() => {
        setPresented(false);
        onDismiss?.();
      }}
    >
      <Presented.Provider value={visible && presented}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </Presented.Provider>
    </Modal>
  );
}
