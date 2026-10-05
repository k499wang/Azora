# Completion and streak sound effects

- `todo-complete.wav`: selected cozy clip 5 by **Case Portman Audio**, from
  [Cute & Cozy UI SFX — Free Sample Pack](https://caseportman.itch.io/cute-cozy-ui-sfx-free-sample-pack).
  Public preview excerpt at 2.198–2.662 seconds, with the audition's 3 ms attack
  and 8 ms ending fade. Duration: 464 ms; peak: -5.49 dBFS.
- `activity-complete.wav`: selected N3, **UI interface positive** by
  **JavierZumer**, from [Freesound](https://freesound.org/people/JavierZumer/sounds/257227/),
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  The audition version increased gain by 14.9 dB. Duration: 1.695 seconds;
  installed mono peak: -3.44 dBFS.

The todo and activity audition MP3s were decoded and resampled into mono, 44.1 kHz,
16-bit PCM WAV files. Installation preserves the auditioned sounds with no
additional pitch, timing, filtering, or gain changes.

Bundled locally for offline playback. The completion hook plays these at 45%
volume and mixes with other audio. The in-app Sound effects setting controls
playback, including when the iPhone's silent switch is on.

`streak-continue.wav` is selected G1, **hero_simple-celebration-01** by **Google**,
from [Material sound resources](https://m2.material.io/design/sound/sound-resources.html),
obtained from the [archived pack](https://archive.org/details/material-design-sound-resources).
The full original sound and its natural decay are preserved; the earlier
512 ms audition trim cut the quiet tail. Peak limiter applied and converted to
mono, 44.1 kHz, 16-bit PCM. Duration: 1.5 seconds. Same selected G1 cue.
The original resource description states CC BY 4.0; archive metadata states
CC BY-SA 4.0. The adapted audio is distributed under CC BY-SA 4.0 with Google credit.

The streak sound plays once when the native streak modal appears, including
on later days. Closing or hiding the popup cancels pending playback. The
commitment step does not replay it.

Credit Case Portman Audio, JavierZumer, and Google. See `LICENSE.txt` for attribution,
modifications, and usage terms.
