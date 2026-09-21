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

const sources: Record<RoutineCoverId, number> = {
  'morning-reset': require('../../../assets/routines/morning-reset.png'),
  'focus-reset': require('../../../assets/routines/focus-reset.png'),
  'evening-wind-down': require('../../../assets/routines/evening-wind-down.png'),
  'bedtime-routine': require('../../../assets/routines/bedtime-routine.jpeg'),
  'weekly-home-reset': require('../../../assets/routines/weekly-home-reset.png'),
  'small-clean': require('../../../assets/routines/little-clean.png'),
};

const retainedImages: Partial<Record<RoutineCoverId, ImageRef>> = {};
const pendingLoads: Partial<Record<RoutineCoverId, Promise<ImageRef>>> = {};

function loadRoutineLibraryImage(id: RoutineCoverId): Promise<ImageRef> {
  const retained = retainedImages[id];
  if (retained != null) return Promise.resolve(retained);
  const pending = pendingLoads[id];
  if (pending != null) return pending;

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
    (Object.keys(sources) as RoutineCoverId[]).map(loadRoutineLibraryImage),
  );
}

export function getRoutineLibraryImageSource(id: RoutineCoverId): ImageRef | number {
  return retainedImages[id] ?? sources[id];
}
