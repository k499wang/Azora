import type { IconName } from '../../../components/common/icons/Icon';
import type { CleanupPlan } from './cleanupPlan';

export type CleanupRoomId =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'living'
  | 'laundry'
  | 'closet'
  | 'office'
  | 'entryway'
  | 'dining'
  | 'kids';

export interface CleanupRoom {
  id: CleanupRoomId;
  label: string;
  icon: IconName;
  plan: CleanupPlan;
}

function room(id: CleanupRoomId, label: string, icon: IconName, objects: CleanupPlan['objects']): CleanupRoom {
  return { id, label, icon, plan: { title: label, objects, safetyNote: null } };
}

/** A full clean of each room, up to 30 minutes: clear what is out first, then work down from high surfaces to the floor. */
export const CLEANUP_ROOMS: readonly CleanupRoom[] = [
  room('kitchen', 'Kitchen', 'todo-dishes', [
    { name: 'Throw out trash and wrappers', minutes: 2 },
    { name: 'Put away food left out', minutes: 2 },
    { name: 'Wash or load the dishes', minutes: 5 },
    { name: 'Clear the counters', minutes: 2 },
    { name: 'Wipe the counters', minutes: 2 },
    { name: 'Wipe the stovetop', minutes: 3 },
    { name: 'Wipe inside the microwave', minutes: 2 },
    { name: 'Wipe the appliance fronts', minutes: 2 },
    { name: 'Wipe the cabinet doors', minutes: 3 },
    { name: 'Shine the sink', minutes: 2 },
    { name: 'Sweep and mop the floor', minutes: 5 },
  ]),
  room('bathroom', 'Bathroom', 'todo-sink', [
    { name: 'Throw out trash and empty bottles', minutes: 2 },
    { name: 'Clear the counter', minutes: 2 },
    { name: 'Hang up clean towels', minutes: 1 },
    { name: 'Put the rugs in the wash', minutes: 2 },
    { name: 'Polish the mirror', minutes: 2 },
    { name: 'Wipe the medicine cabinet', minutes: 3 },
    { name: 'Scrub the sink', minutes: 3 },
    { name: 'Scrub the shower or tub', minutes: 7 },
    { name: 'Scrub the toilet', minutes: 4 },
    { name: 'Sweep and mop the floor', minutes: 4 },
  ]),
  room('bedroom', 'Bedroom', 'todo-bed', [
    { name: 'Throw out trash', minutes: 1 },
    { name: 'Take out cups and dishes', minutes: 2 },
    { name: 'Pick up clothes off the floor', minutes: 4 },
    { name: 'Change the sheets', minutes: 5 },
    { name: 'Clear the nightstand', minutes: 3 },
    { name: 'Clean out one drawer', minutes: 5 },
    { name: 'Dust the dresser and lamps', minutes: 3 },
    { name: 'Dust the blinds and ceiling fan', minutes: 3 },
    { name: 'Vacuum the floor', minutes: 4 },
  ]),
  room('living', 'Living space', 'todo-surface', [
    { name: 'Throw out trash and wrappers', minutes: 2 },
    { name: 'Take out cups and dishes', minutes: 2 },
    { name: 'Fold blankets and fix pillows', minutes: 2 },
    { name: 'Stack books and papers', minutes: 3 },
    { name: 'Put stray things back', minutes: 3 },
    { name: 'Wipe the remotes', minutes: 1 },
    { name: 'Dust the TV and shelves', minutes: 3 },
    { name: 'Wipe the table', minutes: 2 },
    { name: 'Clean the windows', minutes: 4 },
    { name: 'Dust the ceiling fan', minutes: 2 },
    { name: 'Vacuum the floor', minutes: 6 },
  ]),
  room('laundry', 'Laundry room', 'todo-washer', [
    { name: 'Throw out trash and empty bottles', minutes: 2 },
    { name: 'Start one load of laundry', minutes: 3 },
    { name: 'Fold clean clothes', minutes: 6 },
    { name: 'Put away clean clothes', minutes: 4 },
    { name: 'Wipe the washer and dryer', minutes: 2 },
    { name: 'Clean the lint trap', minutes: 1 },
    { name: 'Tidy the shelf', minutes: 3 },
    { name: 'Sweep and mop the floor', minutes: 4 },
  ]),
  room('closet', 'Closet', 'todo-fold', [
    { name: 'Throw out trash', minutes: 1 },
    { name: 'Pick up clothes off the floor', minutes: 4 },
    { name: 'Bag clothes to donate', minutes: 8 },
    { name: 'Hang up loose clothes', minutes: 5 },
    { name: 'Pair up your shoes', minutes: 3 },
    { name: 'Tidy the top shelf', minutes: 4 },
    { name: 'Dust the shelves', minutes: 2 },
    { name: 'Vacuum the floor', minutes: 3 },
  ]),
  room('office', 'Home office', 'todo-priorities', [
    { name: 'Throw out trash and wrappers', minutes: 2 },
    { name: 'Take out cups and dishes', minutes: 2 },
    { name: 'Sort loose papers', minutes: 6 },
    { name: 'File what you need to keep', minutes: 4 },
    { name: 'Clear the desk', minutes: 3 },
    { name: 'Wipe the desk and keyboard', minutes: 3 },
    { name: 'Tidy the cables and chargers', minutes: 3 },
    { name: 'Dust the shelves', minutes: 3 },
    { name: 'Vacuum the floor', minutes: 4 },
  ]),
  room('entryway', 'Entryway', 'todo-shoes', [
    { name: 'Throw out trash and junk mail', minutes: 2 },
    { name: 'Put away shoes', minutes: 3 },
    { name: 'Hang up coats and bags', minutes: 3 },
    { name: 'Sort the mail', minutes: 3 },
    { name: 'Wipe the entry table', minutes: 2 },
    { name: 'Clean the door and handle', minutes: 2 },
    { name: 'Shake out the door mat', minutes: 1 },
    { name: 'Sweep and mop the floor', minutes: 4 },
  ]),
  room('dining', 'Dining room', 'todo-meal', [
    { name: 'Throw out trash', minutes: 1 },
    { name: 'Take cups and dishes to the kitchen', minutes: 3 },
    { name: 'Clear the table', minutes: 3 },
    { name: 'Wipe the table and chairs', minutes: 4 },
    { name: 'Dust the shelves and light', minutes: 3 },
    { name: 'Dust the windowsills', minutes: 2 },
    { name: 'Sweep and mop the floor', minutes: 4 },
  ]),
  room('kids', 'Kids’ room', 'todo-storage', [
    { name: 'Throw out trash', minutes: 2 },
    { name: 'Take out cups and dishes', minutes: 2 },
    { name: 'Pick up clothes off the floor', minutes: 4 },
    { name: 'Put toys back in their bins', minutes: 7 },
    { name: 'Stack books on the shelf', minutes: 3 },
    { name: 'Make the bed', minutes: 2 },
    { name: 'Wipe the desk and nightstand', minutes: 3 },
    { name: 'Dust the shelves', minutes: 3 },
    { name: 'Vacuum the floor', minutes: 4 },
  ]),
];
