import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useWhileVisible } from '../../../hooks/useWhileVisible';

let nextActivation = 0;

/** The screen may stay mounted while covered, but it must release its wake lock. */
export function useTimerKeepAwake(tag: string, active = true) {
  useWhileVisible(() => {
    if (!active) return () => {};
    const activationTag = `${tag}:${++nextActivation}`;
    let live = true;
    activateKeepAwakeAsync(activationTag).then(() => {
      if (!live) deactivateKeepAwake(activationTag);
    }).catch(() => {});
    return () => {
      live = false;
      deactivateKeepAwake(activationTag);
    };
  }, [tag, active]);
}
