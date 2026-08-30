import { useWindowDimensions } from 'react-native';
import { breakpoints, hasDashboardColumns } from '../theme/breakpoints';
import { padding, spacing } from '../theme/spacing';

interface DashboardLayout {
  hasColumns: boolean;
  /** Widest the column is drawn, for rows that must clip at its edge. */
  contentMaxWidth: number;
  /** Edge shared by dashboard cards and controls that sit directly on it. */
  contentInset: number;
  /** Right inset that aligns floating actions with dashboard card content. */
  actionInset: number;
}

/**
 * Responsive facts shared by centered tablet layouts.
 *
 * Every value comes from the current app window, so Stage Manager and Split
 * View update immediately and narrow iPad windows retain the phone layout.
 * The screen margin inside the column is the phone margin at every width: the
 * column already stopped growing, and widening its padding too would leave the
 * tabs sitting on different edges.
 */
export function useDashboardLayout(
  contentMaxWidth: number = breakpoints.dashboardContentMaxWidth,
): DashboardLayout {
  const { width } = useWindowDimensions();
  const centeredMargin = Math.max(0, (width - contentMaxWidth) / 2);
  const contentInset = centeredMargin + padding.screen.horizontal;

  return {
    hasColumns: hasDashboardColumns(width),
    contentMaxWidth,
    contentInset,
    actionInset: Math.max(spacing.lg, contentInset),
  };
}
