import { useEffect, useState, type ReactNode } from 'react';
import { useNavigationState, useRoute } from '@react-navigation/native';
import { Freeze } from 'react-freeze';
import { useTourStore } from '../../features/tour/tourStore';

interface Props {
  children: ReactNode;
}

/**
 * A tab nobody is looking at stops re-rendering until it is chosen again.
 *
 * The native tabs keep every visited tab mounted and live, so one tick on
 * Routine re-rendered Home's whole journey, and the streak refetch it set off
 * re-rendered Home, Profile and the rest — all on the JS thread the tick's
 * celebration was starting on, and once per tick when several landed quickly.
 * Frozen, a hidden tab keeps its state and catches up in one render when it is
 * shown. The tour is the exception, as it is for the stack above: it measures
 * targets on tabs it has not switched to yet.
 *
 * Freezing waits one tick after the tab loses focus, as react-native-screens'
 * own freeze does, so the tab renders its unfocused state first — Routine
 * takes down its light status bar on blur, and frozen on the same render it
 * would have kept it over every other tab. Thawing is immediate.
 *
 * Selection, not focus, decides it: a screen pushed over the tabs blurs the
 * selected tab too, and freezing it then blanked it under the push while the
 * slide was still running. The stack's own `freezeOnBlur` covers that case,
 * and waits for the transition to finish.
 */
export default function HiddenTabFreeze({ children }: Props) {
  const route = useRoute();
  const selected = useNavigationState(
    (state) => state.routes[state.index]?.key === route.key,
  );
  const tourLive = useTourStore(
    (state) => state.status === 'running' || state.status === 'closing',
  );
  const shouldFreeze = !selected && !tourLive;
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFrozen(shouldFreeze), 0);
    return () => clearTimeout(id);
  }, [shouldFreeze]);

  return <Freeze freeze={shouldFreeze && frozen}>{children}</Freeze>;
}
