import { useCompletionSound } from '../../hooks/useCompletionSound';
import ActivityCompletionContent from '../plan/ActivityCompletionContent';
import { cleanupCompletionCopy } from './domain/cleanupCompletionCopy';

export default function PhotoCleanupCompletion({ completedCount, active }: { completedCount: number; active: boolean }) {
  useCompletionSound('activity', { autoPlay: completedCount > 0, active });
  const copy = cleanupCompletionCopy(completedCount);

  return (
    <ActivityCompletionContent
      title={copy.title}
      subtitle={copy.subtitle}
      pose="calm"
    />
  );
}
