import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  contentColumn,
  dashboardContentColumn,
  groupedContentColumn,
} from '../../theme/breakpoints';

export type ScreenContentWidth = 'focused' | 'grouped' | 'dashboard';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  width?: ScreenContentWidth;
}

/**
 * A centered content column sized for what the screen contains.
 *
 * Below the cap this is a plain full-width `View`, so phones render exactly
 * what they rendered before. Above it the column stops growing and centres.
 *
 * Put it inside the scroll content, not around the screen root — full-bleed
 * chrome (backgrounds, scrims) belongs outside the column so it still reaches
 * the window edges.
 *
 * `focused` is the default for prose, forms, and single-task flows. `grouped`
 * gives linear lists and card groups more room. `dashboard` lets charts and
 * peer metric cards use an iPad canvas without stretching to the window edge.
 * All three exceed phone widths, so choosing one changes tablets only.
 */
export default function ScreenContent({
  children,
  style,
  width = 'focused',
}: Props) {
  return <View style={[styles[width], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  focused: contentColumn,
  grouped: groupedContentColumn,
  dashboard: dashboardContentColumn,
});
