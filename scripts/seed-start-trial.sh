#!/bin/bash
# Sends one af_start_trial S2S event to AppsFlyer, mirroring RevenueCat's
# payload shape so the existing AppsFlyer -> Meta mapping forwards it
# unchanged. Rotates across known real installs, keeping each device's real
# ATT status: devices 1-3 and 5 are ATT-authorized (att 3 + real IDFA), while
# devices 4 and 6 are ATT-denied (att 2 + zeroed IDFA, IDFV kept for Meta's
# vendor-ID coverage).
# Meta's AEM checks need a mix of opt-in and opt-out events, so a plain run
# picks opt-in ~40% of the time and opt-out ~60%.
#
# Usage:
#   bash scripts/seed-start-trial.sh        # random device (weighted mix)
#   bash scripts/seed-start-trial.sh 1      # kevin's iPhone (opt-in)
#   bash scripts/seed-start-trial.sh 2      # user A (opt-in)
#   bash scripts/seed-start-trial.sh 3      # user B (opt-in)
#   bash scripts/seed-start-trial.sh 4      # user C (opt-out)
#   bash scripts/seed-start-trial.sh 5      # user D (opt-in, iOS 18)
#   bash scripts/seed-start-trial.sh 6      # user E (opt-out)
set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"

# The inappevent endpoint authenticates with the app's dev key (same as
# RevenueCat's integration). The Security Center S2S/API tokens are rejected.
AUTH_KEY=$(grep '^EXPO_PUBLIC_APPSFLYER_DEV_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
if [ -z "$AUTH_KEY" ]; then
  echo "ERROR: dev key not found in $ENV_FILE" >&2
  exit 1
fi

APP_ID="id6763631574"

DEVICE=${1:-}
if [ -z "$DEVICE" ]; then
  if [ $((RANDOM % 10)) -lt 4 ]; then
    OPT_IN_DEVICES=(1 2 3 5)
    DEVICE=${OPT_IN_DEVICES[$((RANDOM % 4))]}
  else
    OPT_OUT_DEVICES=(4 6)
    DEVICE=${OPT_OUT_DEVICES[$((RANDOM % 2))]}
  fi
fi

case "$DEVICE" in
  1)
    LABEL="kevin-iphone (opt-in)"
    ATT=3
    AF_ID="1784261747249-2429543"
    CUID="e91201f2-73ef-4a55-82f9-eb1576f14ae0"
    IDFA="6AB056BE-D72D-4821-A001-A8214451492D"
    IDFV="F2E4EC29-5434-42E9-9525-451DC736D899"
    OS_VERSION="26.3.1"
    APP_VERSION="1.0.13"
    IP="24.114.29.178"
    ;;
  2)
    LABEL="user-a (opt-in)"
    ATT=3
    AF_ID="1783978167361-6713904"
    CUID="000657ba-c605-4391-bd65-c16566f5f673"
    IDFA="C2155607-7807-4EC3-BE7D-F343D419EA70"
    IDFV="6AB7D13B-9DA0-403A-BC8E-C447E8104893"
    OS_VERSION="26.6"
    APP_VERSION="1.0.12"
    IP="172.219.238.137"
    ;;
  3)
    LABEL="user-b (opt-in)"
    ATT=3
    AF_ID="1783103992913-5352662"
    CUID="8f1b1bb1-d1ad-4781-b443-30933b4bc05b"
    IDFA="475BBBBC-4132-42E4-A788-2957431148F7"
    IDFV="5D3BC526-62F8-4855-849C-1D0091F08FF6"
    OS_VERSION="26.4.2"
    APP_VERSION="1.0.9"
    IP="76.38.154.152"
    ;;
  4)
    LABEL="user-c (opt-out)"
    ATT=2
    AF_ID="1778714026334-1173673"
    CUID="1e2dd5da-6c35-4856-aaa1-8f7b09d7cb85"
    IDFA="00000000-0000-0000-0000-000000000000"
    IDFV="11FE73E6-7FB3-4E30-84B2-ED018FF0EA0B"
    OS_VERSION="26.5.2"
    APP_VERSION="1.0.11"
    IP="76.64.62.71"
    ;;
  5)
    LABEL="user-d (opt-in)"
    ATT=3
    AF_ID="1783556859212-0461694"
    CUID="11e888c7-abf4-4614-aac3-1902693e35fc"
    IDFA="02F08353-9671-4D38-AFB4-D2BB80E578F7"
    IDFV="04F6CC16-EFF9-4FE3-93FC-7DA1F981929E"
    OS_VERSION="18.7.8"
    APP_VERSION="1.0.9"
    IP="129.97.124.130"
    ;;
  6)
    LABEL="user-e (opt-out)"
    ATT=2
    AF_ID="1779560955121-6976643"
    CUID="1335a656-aeae-4f7f-9e45-5b73f5e82060"
    IDFA="00000000-0000-0000-0000-000000000000"
    IDFV="69766437-5C31-4CE0-B58C-05B152AB4045"
    OS_VERSION="26.5"
    APP_VERSION="1.0.12"
    IP="142.198.236.165"
    ;;
  *)
    echo "ERROR: device must be 1, 2, 3, 4, 5, or 6" >&2
    exit 1
    ;;
esac

# Optional second arg: how many hours in the past to stamp eventTime, so a
# batch sent in one sitting still reads as trials spread across the day.
HOURS_AGO=${2:-0}
EVENT_TIME=$(date -u -v-"$HOURS_AGO"H +"%Y-%m-%d %H:%M:%S.000")
ORDER_ID="seed-$(date -u +%s)-$DEVICE-$RANDOM"

BODY=$(cat <<JSON
{
  "af_events_api": "true",
  "appsflyer_id": "$AF_ID",
  "customer_user_id": "$CUID",
  "att": $ATT,
  "idfa": "$IDFA",
  "idfv": "$IDFV",
  "ip": "$IP",
  "bundleIdentifier": "com.azora.breath",
  "app_version_name": "$APP_VERSION",
  "os": "$OS_VERSION",
  "custom_data": {
    "app_id": "appad6908aba6"
  },
  "eventName": "af_start_trial",
  "eventTime": "$EVENT_TIME",
  "eventCurrency": "USD",
  "eventValue": "{\"af_revenue\": \"0.00\", \"af_price\": 0, \"renewal\": \"false\", \"af_content_id\": \"azora_pro_yearly_5999_v2\", \"af_currency\": \"USD\", \"af_order_id\": \"$ORDER_ID\"}"
}
JSON
)

echo "device: $DEVICE ($LABEL)"
echo "payload:"
echo "$BODY"
echo
HTTP_CODE=$(curl -s -o /tmp/af_seed_response.txt -w "%{http_code}" \
  -X POST "https://api2.appsflyer.com/inappevent/$APP_ID" \
  -H "authentication: $AUTH_KEY" \
  -H "Content-Type: application/json" \
  --data "$BODY")

echo "HTTP $HTTP_CODE"
cat /tmp/af_seed_response.txt
echo
if [ "$HTTP_CODE" = "200" ]; then
  echo "OK — af_start_trial accepted for $LABEL."
else
  echo "FAILED — see response above."
fi
