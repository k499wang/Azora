interface CompletionSoundPlayer {
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  play(): void;
  volume: number;
}

/** Keeps one pending completion cue while its asset loads. */
export function createCompletionSoundPlayback(
  player: CompletionSoundPlayer,
  configureAudio: () => Promise<void>,
  onError: (error: unknown) => void = () => {},
) {
  let active = false;
  let ready = false;
  let pending = false;
  let generation = 0;

  const reportError = (error: unknown) => {
    // Feedback and diagnostics must never interrupt the completed action.
    try {
      onError(error);
    } catch {}
  };

  const play = async (request: number) => {
    const isCurrent = () => active && ready && request === generation;
    try {
      if (!isCurrent()) return;
      await configureAudio();
      if (!isCurrent()) return;
      player.pause();
      await player.seekTo(0);
      if (!isCurrent()) return;
      player.volume = 0.45;
      player.play();
    } catch (error) {
      reportError(error);
    }
  };

  const cancel = () => {
    generation += 1;
    pending = false;
    try {
      player.pause();
    } catch (error) {
      reportError(error);
    }
  };

  return {
    setActive(value: boolean) {
      active = value;
      if (!active) cancel();
    },
    setReady(value: boolean) {
      ready = value;
      if (ready && active && pending) {
        pending = false;
        void play(generation);
      }
    },
    request(): boolean {
      if (!active) return false;
      generation += 1;
      pending = !ready;
      if (ready) void play(generation);
      return true;
    },
    cancel,
  };
}
