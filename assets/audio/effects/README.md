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
1.45 seconds, -3 dBFS peak. No third-party audio, no attribution needed.

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

`room-complete.wav` is original to Azora, same synthesis: six soft pop-plinks
climbing a pentatonic scale 115 ms apart (one per landing piece in the room
replay), then a whoosh into a sparkling C-major chord on the seventh. Mono,
48 kHz, 16-bit PCM, 2.5 seconds, -3 dBFS peak. Timed to `RoomReplay`'s
`STAGGER_MS`; change both together.

`coin-count.wav` is original to Azora, same synthesis: eight bright coin tinks
climbing an A pentatonic scale 70 ms apart, ending on a glockenspiel ping with a
little sparkle. Mono, 48 kHz, 16-bit PCM, 1.1 seconds, -3 dBFS peak. It plays as
earned coins count up on a result screen; timed to `useCoinRewardFlight`'s
`COUNT_STEPS` and `COUNT_STEP_MS`, so change them together.

Every cue here is original to Azora; see `LICENSE.txt`.

`breath-*.wav` ("Marimba Breeze") is original to Azora, same synthesis: a
band-passed noise whoosh that rises on the inhale and falls on the exhale, with
marimba notes on top (C5→G5 in, G4→C4 out) and a single G5 tock on holds. Mono,
48 kHz, 16-bit PCM, -3 dBFS peak. Guided breathing plays one at the start of each
phase. `-2s` and `-1s` variants (one note, shorter whoosh) end before phases that
short, for Wim Hof, Bellows Breath and Morning Charge; `breathCues.ts` picks the
length from the technique's pattern.

`path-*.wav` is original to Azora, same synthesis, in a marimba/bell timbre
(sine, inharmonic bar partials, a light FM edge). Mono, 48 kHz, 16-bit PCM,
-3 dBFS peak. All four play on the Plan path:
- `path-tap.wav`: a sine bloop gliding 500→900 Hz, 0.12 seconds. A coin is tapped.
- `path-stamp.wav`: E6 then G#6 80 ms later, 0.45 seconds. A day is stamped done.
- `path-unlock.wav`: C6 E6 G6 C7 rising 60 ms apart with a soft 2–3.5 kHz
  shimmer, 0.7 seconds. The next day wakes up.
- `path-gold.wav`: the stamp pair plus B6 (an E-major triad) and six glints at
  2.6–4 kHz, 0.9 seconds. A gold streak day is stamped.

`attention-*.wav` ("Marimba Breeze" for Resets) is original to Azora, same
synthesis as the breathing cues. `attention-squeeze.wav` is a rising whoosh
with C5→G5 marimba, and `attention-release.wav` is a falling whoosh with
G4→C4. `attention-sense-5.wav` to `attention-sense-1.wav` are single marimba
notes falling G5 E5 D5 C5 G4 as 5-4-3-2-1 counts down. Mono, 48 kHz, 16-bit
PCM, -3 dBFS peak. `useAttentionCueSounds` plays one as each step starts. The
intro and closing steps are silent.
Leaving a step cancels its playing or pending cue, so slow asset loading cannot
play an earlier cue over a later step. Returning mid-step does not replay it;
screen focus, app foreground state, and the Sound effects setting gate playback.
