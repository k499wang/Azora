import { roomProgress, type RoomSlot } from '../../lib/room/roomProgress';
import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

export interface RoomDecorationRow {
  slot: string;
  optionId: string;
  earnedLocalDate: string;
}

export interface Room {
  id: string;
  floor: number;
  shell: string;
  frameHue: string;
  decorations: RoomDecorationRow[];
}

export interface CurrentRoom {
  /** null until the user places their first object, which opens floor 1 */
  room: Room | null;
  /**
   * The user's most recent earn date across every floor. Lives here rather than
   * on `Room` because the one-per-day rule spans rooms — see `roomProgress`.
   */
  lastEarnedLocalDate: string | null;
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
          earned_local_date: string;
        };
        Insert: {
          user_id: string;
          room_id: string;
          slot: string;
          option_id: string;
          earned_local_date: string;
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

const DECORATION_COLUMNS = 'room_id, slot, option_id, earned_local_date';

function getRoomClient(): SupabaseClientLike<RoomDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<RoomDatabase>;
}

async function getDecorations(roomId: string): Promise<RoomDecorationRow[]> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('room_decorations')
    .select(DECORATION_COLUMNS)
    .eq('room_id', roomId);

  if (error != null) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    slot: row.slot,
    optionId: row.option_id,
    earnedLocalDate: row.earned_local_date,
  }));
}

async function getLastEarnedLocalDate(userId: string): Promise<string | null> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('room_decorations')
    .select('earned_local_date')
    .eq('user_id', userId)
    .order('earned_local_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  return data?.earned_local_date ?? null;
}

async function getHighestFloorRoom(userId: string): Promise<Room | null> {
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

/** The room being decorated right now — the highest floor of the hotel. */
export async function getCurrentRoom(userId: string): Promise<CurrentRoom> {
  const [room, lastEarnedLocalDate] = await Promise.all([
    getHighestFloorRoom(userId),
    getLastEarnedLocalDate(userId),
  ]);

  return { room, lastEarnedLocalDate };
}

/** Every floor of the hotel, ground floor first. */
/** every object earned on one day, across floors — the day's reward in History */
export async function getDecorationsEarnedOnDate(
  userId: string,
  localDate: string,
): Promise<RoomDecorationRow[]> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('room_decorations')
    .select(DECORATION_COLUMNS)
    .eq('user_id', userId)
    .eq('earned_local_date', localDate);

  if (error != null) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    slot: row.slot,
    optionId: row.option_id,
    earnedLocalDate: row.earned_local_date,
  }));
}

export async function getRooms(userId: string): Promise<Room[]> {
  const supabase = getRoomClient();
  const roomsResult = await supabase
    .from('rooms')
    .select('id, floor, shell, frame_hue')
    .eq('user_id', userId)
    .order('floor', { ascending: true });

  if (roomsResult.error != null) {
    throw roomsResult.error;
  }

  const rooms = roomsResult.data ?? [];

  if (rooms.length === 0) {
    return [];
  }

  // One query for every floor's decorations rather than one per floor — the
  // hotel grows without bound, and a request per room would too.
  const decorationsResult = await supabase
    .from('room_decorations')
    .select(DECORATION_COLUMNS)
    .eq('user_id', userId);

  if (decorationsResult.error != null) {
    throw decorationsResult.error;
  }

  const byRoom = new Map<string, RoomDecorationRow[]>();
  for (const row of decorationsResult.data ?? []) {
    const existing = byRoom.get(row.room_id) ?? [];
    existing.push({
      slot: row.slot,
      optionId: row.option_id,
      earnedLocalDate: row.earned_local_date,
    });
    byRoom.set(row.room_id, existing);
  }

  return rooms.map((row) => ({
    id: row.id,
    floor: row.floor,
    shell: row.shell,
    frameHue: row.frame_hue,
    decorations: byRoom.get(row.id) ?? [],
  }));
}

export interface RoomLook {
  shell: string;
  frameHue: string;
}

async function createRoom(
  userId: string,
  floor: number,
  look?: RoomLook,
): Promise<Room> {
  const supabase = getRoomClient();
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      user_id: userId,
      floor,
      ...(look != null && { shell: look.shell, frame_hue: look.frameHue }),
    })
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
 * Puts the day's object in the next open slot, opening the user's first room if
 * they have none.
 *
 * The slot is checked here rather than accepted from the caller so a stale
 * screen cannot write out of order. Whether the user has *earned* today is the
 * caller's call — `roomProgress` answers it, and the rule can change without
 * touching the database.
 */
export async function placeDecoration(
  userId: string,
  slot: RoomSlot,
  optionId: string,
  earnedLocalDate: string,
): Promise<CurrentRoom> {
  const supabase = getRoomClient();
  const current = await getCurrentRoom(userId);
  const room = current.room ?? (await createRoom(userId, 1));
  const progress = roomProgress({
    decorations: room.decorations,
    lastEarnedLocalDate: current.lastEarnedLocalDate,
    todayLocalDate: earnedLocalDate,
    dailiesComplete: true,
  });

  if (progress.nextSlot !== slot) {
    throw new Error(
      `Slot ${slot} is not next in this room; expected ${progress.nextSlot ?? 'none — the room is full'}.`,
    );
  }

  const { error } = await supabase.from('room_decorations').insert({
    user_id: userId,
    room_id: room.id,
    slot,
    option_id: optionId,
    earned_local_date: earnedLocalDate,
  });

  if (error != null) {
    throw error;
  }

  return {
    room: { ...room, decorations: await getDecorations(room.id) },
    lastEarnedLocalDate: earnedLocalDate,
  };
}

/**
 * Opens the next floor once the current room is full. Refuses an unfinished
 * room so a floor can never be abandoned half-decorated — the hotel is a wall
 * of finished rooms.
 */
export async function createNextRoom(
  userId: string,
  look: RoomLook,
): Promise<CurrentRoom> {
  const current = await getCurrentRoom(userId);
  const progress = roomProgress({
    decorations: current.room?.decorations ?? [],
    lastEarnedLocalDate: current.lastEarnedLocalDate,
    todayLocalDate: '',
    dailiesComplete: false,
  });

  if (current.room == null || !progress.isComplete) {
    throw new Error('Cannot open the next floor until this room is full.');
  }

  return {
    room: await createRoom(userId, current.room.floor + 1, look),
    lastEarnedLocalDate: current.lastEarnedLocalDate,
  };
}
