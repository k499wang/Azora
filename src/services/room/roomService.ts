import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

export interface RoomDecorationRow {
  slot: string;
  optionId: string;
}

export interface Room {
  id: string;
  floor: number;
  shell: string;
  frameHue: string;
  decorations: RoomDecorationRow[];
}

interface RoomDatabase {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          user_id: string;
          floor: number;
          shell: string;
          frame_hue: string;
        };
        Insert: {
          user_id: string;
          floor?: number;
          shell?: string;
          frame_hue?: string;
        };
        Update: {
          floor?: number;
          shell?: string;
          frame_hue?: string;
        };
        Relationships: [];
      };
      room_decorations: {
        Row: {
          id: string;
          user_id: string;
          room_id: string;
          slot: string;
          option_id: string;
        };
        Insert: {
          user_id: string;
          room_id: string;
          slot: string;
          option_id: string;
        };
        Update: {
          option_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

function getRoomClient(): SupabaseClientLike<RoomDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<RoomDatabase>;
}

async function getDecorations(roomId: string): Promise<RoomDecorationRow[]> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('room_decorations')
    .select('slot, option_id')
    .eq('room_id', roomId);

  if (error != null) {
    throw error;
  }

  return (data ?? []).map((row) => ({ slot: row.slot, optionId: row.option_id }));
}

/** The room being decorated right now — the highest floor of the hotel. */
export async function getCurrentRoom(userId: string): Promise<Room | null> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('rooms')
    .select('id, floor, shell, frame_hue')
    .eq('user_id', userId)
    .order('floor', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return null;
  }

  return {
    id: data.id,
    floor: data.floor,
    shell: data.shell,
    frameHue: data.frame_hue,
    decorations: await getDecorations(data.id),
  };
}

async function createRoom(userId: string, floor: number): Promise<Room> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('rooms')
    .insert({ user_id: userId, floor })
    .select('id, floor, shell, frame_hue')
    .single();

  if (error != null) {
    throw error;
  }

  return {
    id: data.id,
    floor: data.floor,
    shell: data.shell,
    frameHue: data.frame_hue,
    decorations: [],
  };
}

/**
 * Puts an object in a slot, opening the user's first room if they have none.
 * Placing into an occupied slot replaces what was there.
 */
export async function placeDecoration(
  userId: string,
  slot: string,
  optionId: string,
): Promise<Room> {
  const supabase = getRoomClient();
  const room = (await getCurrentRoom(userId)) ?? (await createRoom(userId, 1));

  const { error } = await supabase
    .from('room_decorations')
    .upsert(
      { user_id: userId, room_id: room.id, slot, option_id: optionId },
      { onConflict: 'room_id,slot' },
    );

  if (error != null) {
    throw error;
  }

  return { ...room, decorations: await getDecorations(room.id) };
}
