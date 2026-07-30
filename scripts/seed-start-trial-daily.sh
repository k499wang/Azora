#!/bin/bash
# Daily batch wrapper around seed-start-trial.sh: sends 2 opt-in and 2 opt-out
# af_start_trial events, one per device (1, 2 opt-in; 4, 6 opt-out).
#
# No timestamp is ever reused. Each send gets a minute-precision eventTime in a
# distinct hour bucket of the CURRENT UTC day (never yesterday, never the
# future), and every stamp used is appended to a ledger that later runs read
# back, so no minute is claimed twice even across runs.
#
# Usage:
#   bash scripts/seed-start-trial-daily.sh
#
# Cron (once a day at 14:10 local, output appended to a log):
#   10 14 * * * /bin/bash /Users/k3vinwvng/Documents/Azora/Azora/scripts/seed-start-trial-daily.sh >> /Users/k3vinwvng/Documents/Azora/Azora/scripts/seed-start-trial-daily.log 2>&1
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED="$SCRIPT_DIR/seed-start-trial.sh"
LEDGER="$SCRIPT_DIR/.seed-start-trial-slots"
touch "$LEDGER"

DEVICES=(1 2 4 6)

# Prints its arguments in random order. Written to work on macOS's stock bash
# 3.2, which has no namerefs.
shuffle_list() {
  local items=("$@")
  local i j tmp
  for ((i = ${#items[@]} - 1; i > 0; i--)); do
    j=$((RANDOM % (i + 1)))
    tmp=${items[i]}
    items[i]=${items[j]}
    items[j]=$tmp
  done
  echo "${items[*]}"
}

DEVICES=($(shuffle_list "${DEVICES[@]}"))

# Minutes elapsed in the current UTC day bounds how far back a stamp may go,
# so an offset can never cross midnight into yesterday's date.
NOW_H=$((10#$(date -u +%H)))
NOW_M=$((10#$(date -u +%M)))
ELAPSED=$((NOW_H * 60 + NOW_M))

if [ "$ELAPSED" -lt ${#DEVICES[@]} ]; then
  echo "ERROR: only $ELAPSED minute(s) into the UTC day — not enough distinct" >&2
  echo "       minutes for ${#DEVICES[@]} sends. Run later in the day." >&2
  exit 1
fi

# One hour bucket per send where the day is long enough to give each send its
# own hour; otherwise fall back to distinct minutes inside the elapsed window.
CANDIDATES=()
if [ $((NOW_H + 1)) -ge ${#DEVICES[@]} ]; then
  for ((h = 0; h <= NOW_H; h++)); do CANDIDATES+=("$h"); done
  BUCKETED=1
else
  for ((m = 0; m <= ELAPSED; m++)); do CANDIDATES+=("$m"); done
  BUCKETED=0
fi
CANDIDATES=($(shuffle_list "${CANDIDATES[@]}"))

claimed() {
  grep -qxF "$1" "$LEDGER"
}

# Resolves a candidate to an unclaimed minute offset, or returns 1 if every
# minute it could offer is already taken.
pick_offset() {
  local candidate=$1 hi m offset stamp
  if [ "$BUCKETED" -eq 1 ]; then
    # The current hour is only partly elapsed, so cap it at the current minute.
    hi=59
    if [ "$candidate" -eq "$NOW_H" ]; then hi=$NOW_M; fi
    local minutes=()
    for ((m = 0; m <= hi; m++)); do minutes+=("$m"); done
    minutes=($(shuffle_list "${minutes[@]}"))
    for m in "${minutes[@]}"; do
      offset=$(((NOW_H - candidate) * 60 + NOW_M - m))
      [ "$offset" -lt 0 ] && continue
      stamp=$(date -u -v-"$offset"M +"%Y-%m-%d %H:%M")
      claimed "$stamp" && continue
      PICKED_OFFSET=$offset
      PICKED_STAMP=$stamp
      return 0
    done
    return 1
  fi

  offset=$candidate
  stamp=$(date -u -v-"$offset"M +"%Y-%m-%d %H:%M")
  claimed "$stamp" && return 1
  PICKED_OFFSET=$offset
  PICKED_STAMP=$stamp
  return 0
}

# Assign every device a slot up front so a mid-batch collision can't leave the
# run half sent with a duplicate stamp.
OFFSETS=()
STAMPS=()
ci=0
for _ in "${DEVICES[@]}"; do
  found=0
  while [ "$ci" -lt "${#CANDIDATES[@]}" ]; do
    candidate=${CANDIDATES[ci]}
    ci=$((ci + 1))
    if pick_offset "$candidate"; then
      OFFSETS+=("$PICKED_OFFSET")
      STAMPS+=("$PICKED_STAMP")
      # Claim immediately so the next device can't draw the same minute.
      echo "$PICKED_STAMP" >>"$LEDGER"
      found=1
      break
    fi
  done
  if [ "$found" -eq 0 ]; then
    echo "ERROR: ran out of unused timestamps for today — no send made." >&2
    exit 1
  fi
done

echo "=== seed-start-trial-daily $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
for idx in "${!DEVICES[@]}"; do
  echo "  device ${DEVICES[idx]} -> ${STAMPS[idx]} UTC (${OFFSETS[idx]}m ago)"
done
echo

FAILED=0
for idx in "${!DEVICES[@]}"; do
  device=${DEVICES[idx]}

  echo "--- send $((idx + 1))/${#DEVICES[@]}: device $device @ ${STAMPS[idx]} UTC ---"
  if ! bash "$SEED" "$device" "${OFFSETS[idx]}"; then
    echo "send failed for device $device"
    FAILED=$((FAILED + 1))
  fi
  echo

  if [ "$idx" -lt $((${#DEVICES[@]} - 1)) ]; then
    sleep $((5 + RANDOM % 26))
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo "DONE — ${#DEVICES[@]}/${#DEVICES[@]} events sent (2 opt-in, 2 opt-out)."
else
  echo "DONE — $FAILED of ${#DEVICES[@]} sends failed."
  exit 1
fi
