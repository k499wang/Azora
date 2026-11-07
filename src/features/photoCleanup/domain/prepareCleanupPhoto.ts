interface ResizedPhoto {
  uri: string;
  base64?: string;
}

interface PrepareCleanupPhotoDependencies {
  resize: (uri: string) => Promise<ResizedPhoto>;
  onResized: (uri: string) => void;
  generatePlan: (base64: string) => Promise<void>;
  onFailed: (error: unknown) => void;
}

/** A photo that cannot be read (an iCloud original, say) must return the user to capture. */
export async function prepareCleanupPhoto(
  uri: string,
  { resize, onResized, generatePlan, onFailed }: PrepareCleanupPhotoDependencies,
): Promise<void> {
  try {
    const resized = await resize(uri);
    if (resized.base64 == null) throw new Error('Could not prepare that photo.');
    onResized(resized.uri);
    await generatePlan(resized.base64);
  } catch (error) {
    onFailed(error);
  }
}
