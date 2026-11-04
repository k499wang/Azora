import { Image, type ImageRef } from 'expo-image';
import type { RoutineLibraryId } from '../../data/routineLibrary';

export type RoutineCoverId = Exclude<RoutineLibraryId, 'house-cleaning'>;

type RoutineLibraryImageId = RoutineCoverId | 'house-cleaning';

const sources: Record<RoutineLibraryImageId, number> = {
  'morning-reset': require('../../../assets/explore-art/final/routines/morning-reset.jpg'),
  'focus-reset': require('../../../assets/explore-art/final/routines/focus-reset.jpg'),
  'evening-wind-down': require('../../../assets/explore-art/final/routines/evening-wind-down.jpg'),
  'bedtime-routine': require('../../../assets/explore-art/final/routines/bedtime-routine.jpg'),
  'weekly-home-reset': require('../../../assets/explore-art/final/routines/weekly-home-reset.jpg'),
  'small-clean': require('../../../assets/explore-art/final/routines/small-clean.jpg'),
  'get-ready': require('../../../assets/explore-art/final/routines/get-ready.jpg'),
  'midday-pause': require('../../../assets/explore-art/final/routines/midday-pause.jpg'),
  'workday-shutdown': require('../../../assets/explore-art/final/routines/workday-shutdown.jpg'),
  'kitchen-close': require('../../../assets/explore-art/final/routines/kitchen-close.jpg'),
  'clutter-hot-spots': require('../../../assets/explore-art/final/routines/clutter-hot-spots.jpg'),
  'clutter-sweep': require('../../../assets/explore-art/final/routines/clutter-sweep.jpg'),
  'laundry-day': require('../../../assets/explore-art/final/routines/laundry-day.jpg'),
  'whole-home-hour': require('../../../assets/explore-art/final/routines/whole-home-hour.jpg'),
  'slow-morning': require('../../../assets/explore-art/final/routines/slow-morning.jpg'),
  'phone-free-morning': require('../../../assets/explore-art/final/routines/phone-free-morning.jpg'),
  'morning-movement': require('../../../assets/explore-art/final/routines/morning-movement.jpg'),
  'tidy-before-leaving': require('../../../assets/explore-art/final/routines/tidy-before-leaving.jpg'),
  'deep-work-block': require('../../../assets/explore-art/final/routines/deep-work-block.jpg'),
  'inbox-clear': require('../../../assets/explore-art/final/routines/inbox-clear.jpg'),
  'study-session': require('../../../assets/explore-art/final/routines/study-session.jpg'),
  'phone-down': require('../../../assets/explore-art/final/routines/phone-down.jpg'),
  'tomorrow-setup': require('../../../assets/explore-art/final/routines/tomorrow-setup.jpg'),
  'evening-shower': require('../../../assets/explore-art/final/routines/evening-shower.jpg'),
  'read-before-bed': require('../../../assets/explore-art/final/routines/read-before-bed.jpg'),
  'fridge-clear-out': require('../../../assets/explore-art/final/routines/fridge-clear-out.jpg'),
  'bathroom-wipe-down': require('../../../assets/explore-art/final/routines/bathroom-wipe-down.jpg'),
  'low-energy-day': require('../../../assets/explore-art/final/routines/low-energy-day.jpg'),
  'overwhelmed-reset': require('../../../assets/explore-art/final/routines/overwhelmed-reset.jpg'),
  'anxious-moment': require('../../../assets/explore-art/final/routines/anxious-moment.jpg'),
  'house-cleaning': require('../../../assets/routines/house-cleaning-preview.png'),
};

const retainedImages: Partial<Record<RoutineLibraryImageId, ImageRef>> = {};
const pendingLoads: Partial<Record<RoutineLibraryImageId, Promise<ImageRef>>> = {};

function loadRoutineLibraryImage(id: RoutineLibraryImageId): Promise<ImageRef> {
  const retained = retainedImages[id];
  if (retained != null) return Promise.resolve(retained);
  const pending = pendingLoads[id];
  if (pending != null) return pending;

  // Explore cards are 176pt wide. 512px preserves near-3x sharpness while
  // avoiding a larger decode for the PDF preview and future source artwork.
  const load = Image.loadAsync(sources[id], { maxWidth: 512 })
    .then((image) => {
      retainedImages[id] = image;
      return image;
    })
    .finally(() => {
      delete pendingLoads[id];
    });

  pendingLoads[id] = load;
  return load;
}

/** Predecodes the Explore covers before the library's cards are rendered. */
export async function loadRoutineLibraryImages(): Promise<void> {
  await Promise.allSettled(
    (Object.keys(sources) as RoutineLibraryImageId[]).map(loadRoutineLibraryImage),
  );
}

export function getRoutineLibraryImageSource(
  id: RoutineLibraryImageId,
): ImageRef | number {
  return retainedImages[id] ?? sources[id];
}
