import { Image, type ImageRef } from 'expo-image';
import type { RoutineLibraryId } from '../../data/routineLibrary';

export type RoutineCoverId = Extract<
  RoutineLibraryId,
  | 'morning-reset'
  | 'focus-reset'
  | 'evening-wind-down'
  | 'bedtime-routine'
  | 'weekly-home-reset'
  | 'small-clean'
>;

type RoutineLibraryImageId = RoutineCoverId | 'house-cleaning';

const sources: Record<RoutineLibraryImageId, number> = {
  'morning-reset': require('../../../assets/routines/morning-reset.png'),
  'focus-reset': require('../../../assets/routines/focus-reset.png'),
  'evening-wind-down': require('../../../assets/routines/evening-wind-down.png'),
  'bedtime-routine': require('../../../assets/routines/bedtime-routine.jpeg'),
  'weekly-home-reset': require('../../../assets/routines/weekly-home-reset.png'),
  'small-clean': require('../../../assets/routines/little-clean.png'),
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
