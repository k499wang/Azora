export interface OwnedObject {
  id: string;
  optionId: string;
  acquiredLocalDate: string | null;
}

export interface ObjectPlacement {
  roomId: string;
  slot: string;
  optionId: string;
}

export interface InventoryState {
  ownedIds: Set<string>;
  placedIds: Set<string>;
  freeIds: Set<string>;
}

/** One inventory entitlement can have legacy placements on multiple floors. */
export function inventoryState(input: {
  owned: OwnedObject[];
  placements: ObjectPlacement[];
}): InventoryState {
  const ownedIds = new Set(input.owned.map((object) => object.optionId));
  const placedIds = new Set(
    input.placements
      .map((placement) => placement.optionId)
      .filter((optionId) => ownedIds.has(optionId)),
  );
  return {
    ownedIds,
    placedIds,
    freeIds: new Set([...ownedIds].filter((optionId) => !placedIds.has(optionId))),
  };
}

export function isPlacedInAnotherRoom(
  placements: ObjectPlacement[],
  optionId: string,
  roomId: string,
): boolean {
  return placements.some(
    (placement) =>
      placement.optionId === optionId && placement.roomId !== roomId,
  );
}
