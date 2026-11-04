import { useCompletionSound } from '../../hooks/useCompletionSound';
import ActivityCompletionContent from '../plan/ActivityCompletionContent';
import { cleanupCompletionCopy } from './domain/cleanupCompletionCopy';

interface Props {
  completedCount: number;
  /** wall-clock minutes from Start to the last item, or null when not timed */
  elapsedMinutes: number | null;
  active: boolean;
  kind?: 'cleanup' | 'routine';
}

export default function PhotoCleanupCompletion({ completedCount, elapsedMinutes, active, kind = 'cleanup' }: Props) {
  useCompletionSound('activity', { autoPlay: completedCount > 0, active });
  const copy = cleanupCompletionCopy(completedCount, elapsedMinutes, kind);

  return (
    <ActivityCompletionContent
      title={copy.title}
      subtitle={copy.subtitle}
      pose="calm"
    />
  );
}
