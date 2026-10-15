import type { Poly } from '../RoomScene';
import { DAY1_DECOR } from './day1';
import { DAY2_DECOR } from './day2';
import { DAY3_DECOR } from './day3';
import { DAY4_DECOR } from './day4';
import { DAY5_DECOR } from './day5';
import { DAY6_DECOR } from './day6';
import { DAY7_DECOR } from './day7';

/** every decoration, keyed `dayN.option`, in the storybook style */
export const ROOM_DECOR: Record<string, Poly[]> = {
  ...DAY1_DECOR,
  ...DAY2_DECOR,
  ...DAY3_DECOR,
  ...DAY4_DECOR,
  ...DAY5_DECOR,
  ...DAY6_DECOR,
  ...DAY7_DECOR,
};
