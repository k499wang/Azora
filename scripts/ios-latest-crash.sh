#!/usr/bin/env bash
set -euo pipefail

DEVICE_ID="${1:-${IOS_DEVICE_ID:-2416F155-DD8C-5CB1-BFCD-E95AE114D0DB}}"
APP_NAME="${2:-BreathingAppInit}"
DEST_DIR="${3:-/tmp/iphone-crashlogs}"

mkdir -p "$DEST_DIR"

latest="$(
  xcrun devicectl device info files \
    --device "$DEVICE_ID" \
    --domain-type systemCrashLogs \
    --recurse \
    --filter "name CONTAINS[c] '$APP_NAME'" |
  awk '/\.ips/ { print $1 }' |
  sort |
  tail -n 1
)"

if [[ -z "$latest" ]]; then
  echo "No crash logs found for $APP_NAME on device $DEVICE_ID" >&2
  exit 1
fi

xcrun devicectl device copy from \
  --device "$DEVICE_ID" \
  --domain-type systemCrashLogs \
  --source "$latest" \
  --destination "$DEST_DIR" >/dev/null

crash_file="$DEST_DIR/$latest"

echo "Copied newest crash log:"
echo "$crash_file"
echo
echo "Crash summary:"
grep -E '"captureTime"|"exception"|"termination"|"faultingThread"|"queue"|"symbol":"' "$crash_file" |
  head -n 80 || true
echo
echo "Open it with:"
echo "open -a TextEdit '$crash_file'"
