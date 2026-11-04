# Paywall access for App Review

The release build includes **Settings → Preferences → Azo’s Secret Layer**.
Password: `azo-review`.

The password opens the offer browser. It does not grant Pro, change subscription
eligibility, or simulate a purchase. Access resets when the screen is closed or
the signed-in account changes.

## Notes to paste into App Store Connect

All subscription offers can be accessed through:

1. Sign in with the review account supplied in App Review Information.
2. Open Profile → Settings → Preferences → Azo’s Secret Layer.
3. Enter the password **azo-review** and tap Unlock.
4. Select an offer to open its configured paywall or another supported layout:
   stacked, side by side, single plan, long page, or long page followed by the
   trial flow. The cleaning version of the long page is also available.
5. Select a plan and tap its purchase button to open Apple's purchase sheet.
   Restore purchases is available on the paywall.
6. The Welcome gift and Price drop entries open the live exit-offer flow.

This menu uses the same subscription purchase and restore implementation as the
rest of the app, with live RevenueCat offerings and App Store product prices.
It lists configured, nonempty offerings and uses each selected offering's own
products. Layout choices change presentation; they do not change product prices
or grant introductory-offer eligibility. Review paywalls can be dismissed to
return to the menu.

Free and paid introductory offers appear only when the reviewing Apple account
is eligible. An account that has already used its introductory offer in the
subscription group sees the regular price. The menu does not reset eligibility.

## Before submitting

- Include the entry point and password above in App Review Notes, together with
  a working review account.
- Confirm the required offerings contain the products in the submission, and
  those products load and open the purchase sheet in the submitted build.
- Check the original onboarding and in-app upgrade paths as well as this menu.
- Check purchase, restore, and returning to the menu on a device. Screenshots
  and recordings supplement the working purchase flows.
- Copy any future password change into the review notes before resubmitting.

The password is a local discovery gate for the offer browser, not server-side
authorization. All purchases still use StoreKit and RevenueCat.
