import { inventoryState, type OwnedObject } from '../../lib/room/inventory';
import { requireSupabaseClient } from '../supabase';
import { getRooms } from './roomService';

export interface RoomInventory {
  objects: OwnedObject[];
  ownedShells: string[];
  state: ReturnType<typeof inventoryState>;
}

export async function getRoomInventory(userId: string): Promise<RoomInventory> {
  const supabase = requireSupabaseClient();
  const [objectsResult, shellsResult, rooms] = await Promise.all([
    supabase
      .from('owned_objects')
      .select('id, option_id, acquired_local_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('owned_room_shells')
      .select('shell')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    getRooms(userId),
  ]);
  if (objectsResult.error != null) throw objectsResult.error;
  if (shellsResult.error != null) throw shellsResult.error;

  const objects = (objectsResult.data ?? []).map((row) => ({
    id: row.id,
    optionId: row.option_id,
    acquiredLocalDate: row.acquired_local_date,
  }));
  const placements = rooms.flatMap((room) =>
    room.decorations.map((decoration) => ({
      roomId: room.id,
      slot: decoration.slot,
      optionId: decoration.optionId,
    })),
  );

  return {
    objects,
    ownedShells: (shellsResult.data ?? []).map((row) => row.shell),
    state: inventoryState({ owned: objects, placements }),
  };
}
