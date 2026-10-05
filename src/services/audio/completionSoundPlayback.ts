interface CompletionSoundPlayer {
  pause(): void;
  seekTo(seconds: number, toleranceMillisBefore?: number, toleranceMillisAfter?: number): Promise<void>;
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
  let draining = false;

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

  const drain = async () => {
    if (draining) return;
    draining = true;
    try {
      while (active && ready && pending) {
        pending = false;
        const request = generation;
        const isCurrent = () => active && ready && request === generation;
        try {
          if (!await prepare() || !isCurrent()) continue;
          // AVPlayer's default seek tolerance is unbounded. Exact seeking and
          // one outstanding seek prevent rapid taps cancelling each other's
          // rewind or resuming partway through this short cue.
          await player.seekTo(0, 0, 0);
          if (!isCurrent()) continue;
          player.volume = 0.45;
          player.play();
        } catch (error) {
          reportError(error);
        }
      }
    } finally {
      draining = false;
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
        void drain();
      }
    },
    request(): boolean {
      if (!active) return false;
      generation += 1;
      pending = true;
      // Silence immediately without pause(), which schedules iOS session
      // deactivation. The newest request restores volume after its rewind.
      try {
        player.volume = 0;
      } catch (error) {
        reportError(error);
      }
      if (ready) void drain();
      return true;
    },
    cancel,
  };
}
