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
  let configuration: Promise<boolean> | null = null;

  const reportError = (error: unknown) => {
    // Feedback and diagnostics must never interrupt the completed action.
    try {
      onError(error);
    } catch {}
  };

  const prepare = () => {
    if (configuration == null) {
      const preparing = Promise.resolve().then(async () => {
        if (!active || configuration !== preparing) return false;
        await configureAudio();
        return true;
      }).catch((error) => {
        if (configuration === preparing) configuration = null;
        reportError(error);
        return false;
      });
      configuration = preparing;
    }
    return configuration;
  };

  const play = async (request: number) => {
    const isCurrent = () => active && ready && request === generation;
    try {
      if (!isCurrent()) return;
      if (!await prepare()) return;
      if (!isCurrent()) return;
      // Seeking restarts this same player. Pausing first also schedules iOS
      // audio-session deactivation, which can race a rapid replay.
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
      if (active === value) return;
      active = value;
      if (!active) {
        cancel();
        configuration = null;
      } else {
        // Prepare on arrival, before a completion starts its animations.
        void prepare();
      }
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
