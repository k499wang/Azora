import type { ViewStyle } from 'react-native';

// iPhone SE (2nd/3rd gen) is 375 × 667. After safe areas it has roughly 110pt
// less usable height than a modern iPhone, which is where fixed-height heroes
// and generous vertical padding start clipping. These thresholds sit just above
// the SE so it and anything smaller resolve as short/narrow.
export const breakpoints = {
  shortHeight: 700,
  narrowWidth: 380,
  /**
   * The widest focused reading/form content is drawn.
   *
   * A focused flow uses `padding.screen.horizontal` either side, which on a
   * phone is the whole width and on an iPad needs a readable line length.
   * Dashboards and grouped lists use their semantic widths below instead of
   * forcing every kind of content through this measure.
   *
   * 480 is chosen against the type scale below: a tablet column carries the
   * same number of characters per line as a phone does, so the measure the
   * copy was written for survives.
   */
  contentMaxWidth: 480,
  /** Inset-grouped lists and linear card collections that need more breathing room. */
  groupedContentMaxWidth: 680,
  /**
   * Data-rich screens whose charts and summary cards benefit from tablet width.
   *
   * Home, Heart and Profile all draw at this measure, so moving between tabs on
   * an iPad never shifts the margin the content sits on.
   */
  dashboardContentMaxWidth: 800,
  /**
   * Where the layout stops being a phone laid out larger and starts being a
   * tablet layout: screens with two substantial things to show can put them
   * side by side while browsing shelves reveal more of their horizontal row.
   *
   * Read from the *window*, never the device. iPadOS 26 deprecated
   * `UIRequiresFullScreen`, so an app can no longer refuse to be resized — an
   * iPad can hand this layout a 320pt Slide Over window, and a phone-shaped
   * window wants the phone layout whatever the hardware underneath it is.
   */
  regularWidth: 600,
  /** Enough room for three peer summary cards without making any one phone-narrow. */
  dashboardColumnsWidth: 800,
} as const;

export function isShortScreen(height: number): boolean {
  return height <= breakpoints.shortHeight;
}

export function isNarrowScreen(width: number): boolean {
  return width <= breakpoints.narrowWidth;
}

export function isRegularWidth(width: number): boolean {
  return width >= breakpoints.regularWidth;
}

export function hasDashboardColumns(width: number): boolean {
  return width >= breakpoints.dashboardColumnsWidth;
}

/**
 * The content column as a style, for layouts that already own a container and
 * only need it capped. `ScreenContent` is the same rule as a component, for
 * layouts that need a new wrapper; both read from `contentMaxWidth`, so the
 * column is one number in one place.
 */
export const contentColumn: ViewStyle = {
  width: '100%',
  maxWidth: breakpoints.contentMaxWidth,
  alignSelf: 'center',
};

export const groupedContentColumn: ViewStyle = {
  width: '100%',
  maxWidth: breakpoints.groupedContentMaxWidth,
  alignSelf: 'center',
};

export const dashboardContentColumn: ViewStyle = {
  width: '100%',
  maxWidth: breakpoints.dashboardContentMaxWidth,
  alignSelf: 'center',
};
