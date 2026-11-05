import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useAuthStore } from '../../stores/authStore';
import { useFirstWinOfDayStore } from '../selfCare/firstWinOfDayStore';
import { useTourStore } from '../tour/tourStore';
import EnjoymentPromptSheet from './EnjoymentPromptSheet';
import { useEnjoymentPrompt } from './useEnjoymentPrompt';

interface Props {
  /** whether the screen hosting it is on top, with no modal of its own open */
  active: boolean;
}

export default function EnjoymentPromptPresenter({ active }: Props) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const firstWinShowing = useFirstWinOfDayStore((state) => state.showing);
  const tourFinished = useTourStore((state) => state.status === 'finished');
  const { visible, answer } = useEnjoymentPrompt({
    userId,
    todayLocalDate,
    active: active && !firstWinShowing && tourFinished,
  });

  return <EnjoymentPromptSheet visible={visible} onAnswer={answer} />;
}
