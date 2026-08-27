const mountedOverlays = new Map<number, Set<symbol>>();

/** Tracks the screen-local owner so orchestration can recover if none mounts. */
export function registerTourOverlay(stepIndex: number): () => void {
  const owner = Symbol('tour-overlay');
  const owners = mountedOverlays.get(stepIndex) ?? new Set<symbol>();
  owners.add(owner);
  mountedOverlays.set(stepIndex, owners);

  return () => {
    const current = mountedOverlays.get(stepIndex);
    if (current == null) return;
    current.delete(owner);
    if (current.size === 0) mountedOverlays.delete(stepIndex);
  };
}

export function isTourOverlayMounted(stepIndex: number): boolean {
  return (mountedOverlays.get(stepIndex)?.size ?? 0) > 0;
}
