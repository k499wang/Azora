import { AnalyticsEvent } from './events';

/**
 * Which exit intent summoned the discounted offer.
 *
 * The three are not the same user. `purchase_cancelled` backed out of the store
 * sheet with their thumb on the button; `idle` may only have been reading;
 * `post_onboarding` already said no once and is meeting the offer over Home.
 * Discounting all three identically is a decision worth being able to check.
 */
export type ExitOfferTrigger =
  | 'idle'
  | 'purchase_cancelled'
  | 'post_onboarding';

/** How the offer was refused. */
export type ExitOfferDeclineMethod =
  /** the explicit "no thanks" control */
  | 'button'
  /** back gesture or hardware back, through the confirm dialog */
  | 'system_close';

/**
 * `usePaywall`'s generic capture, which folds in the shared paywall properties —
 * placement, offering, both price points, experiment variant. Taking it as an
 * argument keeps these three events on exactly the same property contract as
 * the `paywall_*` events they sit beside.
 */
type TrackEvent = (
  event: string,
  extra?: Record<string, string | number | boolean | null>,
) => void;

export function trackExitOfferShown(
  trackEvent: TrackEvent,
  trigger: ExitOfferTrigger,
) {
  trackEvent(AnalyticsEvent.ExitOfferShown, { trigger });
}

export function trackExitOfferAccepted(
  trackEvent: TrackEvent,
  trigger: ExitOfferTrigger,
  outcome: 'purchased' | 'restored',
) {
  trackEvent(AnalyticsEvent.ExitOfferAccepted, { trigger, outcome });
}

export function trackExitOfferDeclined(
  trackEvent: TrackEvent,
  trigger: ExitOfferTrigger,
  method: ExitOfferDeclineMethod,
) {
  trackEvent(AnalyticsEvent.ExitOfferDeclined, { trigger, decline_method: method });
}
