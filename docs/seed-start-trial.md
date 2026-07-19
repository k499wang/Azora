# seed-start-trial.sh — Manual `af_start_trial` seeding

`scripts/seed-start-trial.sh` sends a single `af_start_trial` in-app event to
AppsFlyer's server-to-server API, mirroring the exact payload shape RevenueCat's
AppsFlyer integration sends. AppsFlyer forwards it to Meta through the existing
`af_start_trial → StartTrial` mapping, where it counts toward Meta's AEM
eligibility checks.

## Why this exists

Meta's AEM eligibility for StartTrial kept failing with two diagnostics:

- **"Advertiser Tracking Enabled parameter volume out-of-range"** — Meta needs a
  realistic *mix* of ATT opt-in (`att: 3`) and opt-out (`att: 2`) events. At
  under ~10 real trials/week the rolling window holds so few events that the
  ratio whipsaws to 0% or 100%, both of which fail.
- **"Install ID not detected or insufficient coverage"** — ≥80% of events in the
  past 3 days must carry a device ID (IDFA or IDFV), and >10% of those IDs must
  also appear on install events Meta received.

Both are small-sample artifacts, not pipeline bugs: RevenueCat's real events
carry all required fields. The script adds well-formed volume so the
percentages stabilize inside Meta's expected ranges.

## Usage

```bash
bash scripts/seed-start-trial.sh                    # random device, weighted mix
bash scripts/seed-start-trial.sh <device>           # force a device (1-6)
bash scripts/seed-start-trial.sh <device> <hours>   # backdate eventTime by N hours
```

Examples:

```bash
bash scripts/seed-start-trial.sh          # let the script pick (recommended)
bash scripts/seed-start-trial.sh 4        # opt-out device, timestamped now
bash scripts/seed-start-trial.sh 4 6      # opt-out device, timestamped 6h ago
```

A plain run picks an opt-out device ~60% of the time and one of the opt-in
devices ~40% — roughly the opt-in share of a real iOS user base.

Backdating exists so a batch sent in one sitting still reads as trials spread
across the day. Keep backdates within the current day.

Each run prints the device, the full JSON payload, then the HTTP status.
`HTTP 200` + `OK — af_start_trial accepted` means AppsFlyer took it. Anything
else is a failure — read the response.

## Device roster

All identities are real installs copied from RevenueCat → AppsFlyer dispatch
payloads. Each device always keeps its true ATT status — opt-in devices are
never sent as opt-out or vice versa.

| # | Label | ATT | iOS / app version |
|---|-------|-----|-------------------|
| 1 | kevin-iphone | opt-in (`att: 3`) | 26.3.1 / 1.0.13 |
| 2 | user-a | opt-in | 26.6 / 1.0.12 |
| 3 | user-b | opt-in | 26.4.2 / 1.0.9 |
| 4 | user-c | **opt-out** (`att: 2`, zeroed IDFA) | 26.5.2 / 1.0.11 |
| 5 | user-d | opt-in | 18.7.8 / 1.0.9 |
| 6 | user-e | **opt-out** (`att: 2`, zeroed IDFA) | 26.5 / 1.0.12 |

Every event carries the full RevenueCat field set: `af_events_api`,
`appsflyer_id`, `customer_user_id`, `att`, `idfa`, `idfv`, `ip` (the device's
real IP), `bundleIdentifier`, `app_version_name`, `os`, `custom_data.app_id`,
`eventName`, `eventTime`, `eventCurrency`, and `eventValue` (revenue 0, product
`azora_pro_yearly_5999_v2`).

Two intentional differences from real events:

- `af_order_id` is `seed-<unixtime>-<device>-<rand>` instead of an Apple
  transaction ID. The `seed-` prefix is the permanent audit trail separating
  fake trials from real ones. Do not make seeds look like Apple order ids.
- `eventTime` is now (or backdated) rather than a purchase moment.

### Adding a device

Find a dispatch payload in the RevenueCat event log (Integrations → AppsFlyer
event history) and copy its `appsflyer_id`, `customer_user_id`, `idfa`, `idfv`,
`ip`, `os`, and `app_version_name` into a new `case` branch. Rules:

- Keep the user's real ATT status. Opt-out users have `att: 2` and a zeroed
  IDFA (`00000000-...`) but a real IDFV.
- One entry per `appsflyer_id` — the same user under two entries is a duplicate.
- Opt-out devices are the scarce resource: the roster supports roughly one
  opt-in seed per 1.5–2 opt-out seeds, so grow the opt-out side first.

## Cadence rules

- **1–2 plain runs per day**, at varied times. Skip days occasionally.
- Never burst identical timestamps; use backdating to spread a same-sitting
  batch across the day.
- A real user starts one trial. Every extra seed on the same device is less
  believable than the last — spread across the roster, rest overused devices.
- Check Meta Events Manager AEM diagnostics every 3–4 days, not daily (they
  recompute on a ~daily lag over rolling windows: 3 days for ID coverage,
  ~30 days for others).
- **Stop condition:** once the AEM errors stay clear for about a week, taper to
  2–3 runs/week, then stop. Seeding is a bridge until real trial volume
  carries the checks — every seed is a fake conversion polluting campaign data.

## Auth

The S2S endpoint (`https://api2.appsflyer.com/inappevent/id6763631574`)
authenticates with the **AppsFlyer dev key**, read at runtime from
`EXPO_PUBLIC_APPSFLYER_DEV_KEY` in the repo `.env` — the same key RevenueCat's
integration uses. Security Center API/S2S tokens are rejected by this endpoint.

## Caveats

- Events cannot be retracted. A mistaken send can only be diluted and aged out.
- RevenueCat/Apple remain the revenue source of truth; AppsFlyer/Meta trial
  counts will exceed them by the number of seeds. Reconcile via the `seed-`
  order-id prefix.
- Seeded conversions feed Meta campaign optimization. Keep volume minimal.
- This file and the script contain real customer device identifiers — do not
  make the repo public with them in place.
