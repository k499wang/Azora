import type { CompletionAudioNative } from '../../native/completionAudio';

let nextOwner = 0;

/** Preload off the tap path; native restart is one asynchronous queue command. */
export function createNativeCompletionSoundPlayback(
  native: CompletionAudioNative,
  loadUri: () => Promise<string>,
  configureAudio: () => Promise<void>,
  onError: (error: unknown) => void = () => {},
) {
  const owner = `completion-${++nextOwner}`;
  let active = false;
  let ready = false;
  let disposed = false;
  let pending = false;
  let prepared = false;
  let configured = false;
  let preparation: Promise<void> | null = null;

  const report = (error: unknown) => {
    try { onError(error); } catch {}
  };

  const restart = () => {
    // Each call starts a fresh native voice on its serial queue. Waiting for
    // its promise on JS would merge taps arriving before the acknowledgement.
    try { void native.restart(owner, 0.45).catch(report); } catch (error) { report(error); }
  };

  const prepare = () => {
    if (preparation != null || disposed || !active || !ready) return;
    preparation = (async () => {
      await configureAudio();
      if (disposed || !active) return;
      configured = true;
      if (!prepared) {
        const uri = await loadUri();
        if (disposed || !active) return;
        await native.prepare(owner, uri);
        prepared = true;
      }
    })().catch(report).finally(() => {
      preparation = null;
      if (!disposed && active && ready && prepared && configured && pending) {
        pending = false;
        restart();
      }
    });
  };

  const cancel = () => {
    pending = false;
    void native.stop(owner).catch(report);
  };

  return {
    setActive(value: boolean) {
      if (disposed || active === value) return;
      active = value;
      if (!active) {
        configured = false;
        cancel();
      }
      else prepare();
    },
    setReady(value: boolean) {
      ready = value;
      if (ready) prepare();
    },
    request(): boolean {
      if (!active || disposed) return false;
      // No synchronous native player getters, setters, seeks or session work.
      if (preparation == null && prepared && configured && ready) restart();
      else {
        pending = true;
        prepare();
      }
      return true;
    },
    cancel,
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      pending = false;
      void native.release(owner).catch(report);
    },
  };
}
