# AppsFlyer SKAN Free-Trial Runbook

This note explains what to change in AppsFlyer SKAN Conversion Studio for the
Meta warning:

```text
App event not configured for SKAdNetwork: The SUBSCRIBE event is not configured
for Apple's SKAdNetwork.
```

It assumes RevenueCat sends subscription lifecycle events to AppsFlyer
server-to-server, and AppsFlyer owns SKAN conversion values.

## Event Choice

Use the event that matches the user action:

| User action | AppsFlyer event | Meta mapping |
| --- | --- | --- |
| User starts a free trial | `af_start_trial` | `StartTrial` |
| User becomes a subscriber | `af_subscribe` | `Subscribe` |
| User produces purchase revenue | `af_purchase` | `Purchase` or `fb_mobile_purchase` |

Do not use `af_subscribe` as the trial-start event if `af_start_trial` exists
and fires correctly. Use `af_subscribe` for the subscription signal Meta is
complaining about.

If AppsFlyer only shows `af_subscribe` and `af_purchase`, first confirm whether
RevenueCat is actually sending a trial-start event. Check:

```text
RevenueCat > Project Settings > Integrations > AppsFlyer
```

Then check a test customer:

```text
RevenueCat > Customer > Customer History > trial/purchase event > AppsFlyer integration
```

## Why Capacity Shows 128 / 64

If you add only one event and AppsFlyer says:

```text
Fine conversion value 128 / 64 too high
```

then Window 1 probably still has Revenue enabled. AppsFlyer is combining:

```text
64 revenue buckets x 2 event states = 128 values
```

Fix this by removing Revenue from Window 1 or reducing its revenue buckets. For
this Meta Subscribe warning, the important fix is that the subscription event is
included in the SKAN schema, not that Window 1 has detailed revenue ranges.

## Recommended SKAN Setup

### Window 1

Use Fine conversion values for the early, high-volume action:

```text
Window 1 / Fine:
af_start_trial
```

If some users pay immediately without a trial, add only one more event if
capacity allows:

```text
Window 1 / Fine:
af_start_trial
af_subscribe
```

If this exceeds capacity, remove Revenue from Window 1 before removing the event.

### Window 2

Use Coarse values for paid conversion after the free trial:

```text
Window 2 / Coarse:
Low = af_start_trial
Medium = af_subscribe
High = af_purchase
```

If `af_subscribe` and `af_purchase` fire for the same moment, keep:

```text
Medium = af_subscribe
High = af_purchase
```

This gives Meta a Subscribe signal while still preserving purchase/revenue as
the highest-value outcome.

### Window 3

Keep Window 3 simple. Use it only for later subscriber value:

```text
Window 3 / Coarse:
Low = retained user
Medium = renewal
High = high-value renewal or purchase
```

If there is no clear renewal event in the AppsFlyer list, leave Window 3 minimal.

## Click-By-Click Changes

1. Go to:

```text
AppsFlyer > Settings > SKAN Conversion Studio
```

2. Click the options menu:

```text
...
```

3. Make sure:

```text
SKAN measurement = On
```

4. If available, turn on:

```text
Record in-app events sent by server-to-server API
```

RevenueCat sends trial and purchase events to AppsFlyer server-to-server.

5. In Window 1, choose Fine.

6. Remove the Revenue component from Window 1 if capacity is too high.

7. Add:

```text
af_start_trial
```

8. Add `af_subscribe` to Window 1 only if users can subscribe immediately and
capacity stays at or below 64.

9. In Window 2, use Coarse values:

```text
Low = af_start_trial
Medium = af_subscribe
High = af_purchase
```

10. Save the SKAN Conversion Studio setup.

## Meta Mapping After Saving

SKAN Conversion Studio alone is not enough. After saving, map the events to Meta:

```text
AppsFlyer > Collaborate > Active Integrations > Meta ads > Integration
```

Enable:

```text
In-app event postbacks
```

Map:

```text
af_start_trial -> StartTrial
af_subscribe -> Subscribe
af_purchase -> Purchase / fb_mobile_purchase
```

Save the integration.

Then copy the AppsFlyer Meta MMP connection URL and import it in Meta:

```text
Meta Events Manager > App > Settings > Configure events > Import from Partner App
```

Wait up to 24 hours for Meta to sync the new SKAN configuration.

## Decision Rule

Use this priority if AppsFlyer capacity is limited:

1. Keep `af_subscribe` somewhere in SKAN because this fixes the Meta Subscribe warning.
2. Keep `af_start_trial` in Window 1 because it is the best early free-trial signal.
3. Keep `af_purchase` as the highest coarse value in Window 2 for paid/revenue outcomes.
4. Remove or simplify Revenue ranges before removing those lifecycle events.
