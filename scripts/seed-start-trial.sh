#!/bin/bash
# Sends one af_start_trial S2S event to AppsFlyer for Kevin's own device install,
# mirroring RevenueCat's payload shape so the existing AppsFlyer -> Meta mapping
# forwards it unchanged. Auth uses the app's AppsFlyer dev key from the repo .env.
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
EVENT_TIME=$(date -u +"%Y-%m-%d %H:%M:%S.000")
ORDER_ID="seed-$(date -u +%s)"

BODY=$(cat <<JSON
{
  "appsflyer_id": "1784261747249-2429543",
  "customer_user_id": "e91201f2-73ef-4a55-82f9-eb1576f14ae0",
  "att": 3,
  "idfa": "6AB056BE-D72D-4821-A001-A8214451492D",
  "idfv": "F2E4EC29-5434-42E9-9525-451DC736D899",
  "bundleIdentifier": "com.azora.breath",
  "app_version_name": "1.0.13",
  "os": "26.3.1",
  "eventName": "af_start_trial",
  "eventTime": "$EVENT_TIME",
  "eventCurrency": "USD",
  "eventValue": "{\"af_revenue\": \"0.00\", \"af_price\": 0, \"renewal\": \"false\", \"af_content_id\": \"azora_pro_yearly_5999_v2\", \"af_currency\": \"USD\", \"af_order_id\": \"$ORDER_ID\"}"
}
JSON
)

echo "eventTime: $EVENT_TIME"
echo "af_order_id: $ORDER_ID"
HTTP_CODE=$(curl -s -o /tmp/af_seed_response.txt -w "%{http_code}" \
  -X POST "https://api2.appsflyer.com/inappevent/$APP_ID" \
  -H "authentication: $AUTH_KEY" \
  -H "Content-Type: application/json" \
  --data "$BODY")

echo "HTTP $HTTP_CODE"
cat /tmp/af_seed_response.txt
echo
if [ "$HTTP_CODE" = "200" ]; then
  echo "OK — event accepted by AppsFlyer. Check the live event stream (Dashboard -> Event Stream / Activity) in a minute or two."
else
  echo "FAILED — see response above."
fi
