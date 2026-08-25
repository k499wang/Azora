# Audio Normalization Commands

Use these commands from the repo root:

```bash
cd /Users/k3vinwvng/Documents/Azora/Azora
```

## Targets

- Narrator voice: `-18 LUFS`
- Background audio: `-30 LUFS`

## Narrator Voice

```bash
ffmpeg -y -i assets/audio/voices/theo_in.mp3 \
  -af loudnorm=I=-18:TP=-1.5:LRA=11 \
  /tmp/azora_theo_in.mp3

ffmpeg -y -i assets/audio/voices/theo_out.mp3 \
  -af loudnorm=I=-18:TP=-1.5:LRA=11 \
  /tmp/azora_theo_out.mp3

ffmpeg -y -i assets/audio/voices/theo_hold.mp3 \
  -af loudnorm=I=-18:TP=-1.5:LRA=11 \
  /tmp/azora_theo_hold.mp3

mv /tmp/azora_theo_in.mp3 assets/audio/voices/theo_in.mp3
mv /tmp/azora_theo_out.mp3 assets/audio/voices/theo_out.mp3
mv /tmp/azora_theo_hold.mp3 assets/audio/voices/theo_hold.mp3
```

## Background Audio

```bash
ffmpeg -y -i assets/audio/ambient/rain.mp3 \
  -af loudnorm=I=-30:TP=-2:LRA=11 \
  /tmp/azora_rain.mp3

mv /tmp/azora_rain.mp3 assets/audio/ambient/rain.mp3
```

## Spot Check Loudness

```bash
ffmpeg -hide_banner -i assets/audio/voices/theo_in.mp3 \
  -af loudnorm=I=-18:TP=-1.5:LRA=11:print_format=summary \
  -f null -

ffmpeg -hide_banner -i assets/audio/ambient/rain.mp3 \
  -af loudnorm=I=-30:TP=-2:LRA=11:print_format=summary \
  -f null -
```

Runtime balance lives in `src/features/audioSettings/audioMix.ts`.
