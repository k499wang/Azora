import { useCompletionSound } from '../../hooks/useCompletionSound';
import AzoPortrait from '../mascot/AzoPortrait';
import ActivityCompletionContent from '../plan/ActivityCompletionContent';
import { cleanupCompletionCopy } from './domain/cleanupCompletionCopy';

export default function PhotoCleanupCompletion({ completedCount, active }: { completedCount: number; active: boolean }) {
  useCompletionSound('activity', { autoPlay: completedCount > 0, active });
  const copy = cleanupCompletionCopy(completedCount);

  return (
    <ActivityCompletionContent
      title={copy.title}
      subtitle={copy.subtitle}
      hero={completedCount === 0 ? <AzoPortrait size={144} active={active} /> : undefined}
    />
  );
}
