# Completion and streak sound effects

- `todo-complete.wav`: original to Azora. A tiny bubble pop, two quick
  glockenspiel notes going up (E7→A7) and a light sparkle. 0.5 seconds.
- `activity-complete.wav`: original to Azora. A bubble pop, three quick
  glockenspiel notes (G5 B5 D6), then a held sparkling celesta chord. 1.7 seconds.

Both are synthesized in Python in the same style as `gift-open.wav` and
`decoration-place.wav` below: mono, 48 kHz, 16-bit PCM, -3 dBFS peak. No
third-party audio, no attribution needed.

Bundled locally for offline playback. The completion hook plays these at 45%
volume and mixes with other audio. The in-app Sound effects setting controls
playback, including when the iPhone's silent switch is on.

`streak-continue.wav` is original to Azora: one long rising whoosh, band-passed
noise sweeping 200 Hz to 4 kHz with an airy upper layer and a short room tail,
no notes. Synthesized in Python like the cues below. Mono, 48 kHz, 16-bit PCM,
1.1 seconds, -3 dBFS peak. No third-party audio, no attribution needed.

The streak sound plays once when the native streak modal appears, including
on later days. Closing or hiding the popup cancels pending playback. The
commitment step does not replay it.

`gift-open.wav` is original to Azora: synthesized in Python (paper-lift noise,
a rising bubble pop, then a glockenspiel C-major arpeggio with sparkle pings and
a short room tail). Mono, 48 kHz, 16-bit PCM, 1.45 seconds, -3 dBFS peak. No
third-party audio, no attribution needed. It plays as the gift lid pops on the
decoration-unlocked screen.

`decoration-place.wav` is original to Azora, built from the same synthesis
script: a soft low thump with a small pop, a G6→C7 glockenspiel pair and a few
sparkle pings. Mono, 48 kHz, 16-bit PCM, 1.05 seconds, -3 dBFS peak. It plays
when a decoration lands in the room.

Every cue here is original to Azora; see `LICENSE.txt`.
