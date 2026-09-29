import type { ReactNode } from 'react';
import { useIsFocused } from '@react-navigation/native';
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
 */
export default function HiddenTabFreeze({ children }: Props) {
  const focused = useIsFocused();
  const tourLive = useTourStore(
    (state) => state.status === 'running' || state.status === 'closing',
  );

  return <Freeze freeze={!focused && !tourLive}>{children}</Freeze>;
}
