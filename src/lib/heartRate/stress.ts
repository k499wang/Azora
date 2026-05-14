import { colors } from '../../theme/colors';

export interface StressZone {
  label: string;
  color: string;
}

export function getStressZone(stress: number): StressZone {
  if (stress <= 33) return { label: 'Low', color: colors.primary.blue500 };
  if (stress <= 66) return { label: 'Moderate', color: colors.orange[500] };
  return { label: 'High', color: colors.orange[700] };
}
