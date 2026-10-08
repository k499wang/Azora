import { ROOM_SLOT_COUNT } from './room/roomProgress';

export type ProfileRecordKey = 'longestStreak' | 'roomsFinished';

export interface ProfileRecord {
  key: ProfileRecordKey;
  value: number;
  localDate: string | null;
  locked: boolean;
}

interface ProfileRecordsInput {
  longestStreak: number;
  rooms: readonly { decorations: readonly { earnedLocalDate: string }[] }[];
}

function latestDate(dates: readonly string[]): string | null {
  return dates.reduce<string | null>(
    (latest, date) => (latest == null || date > latest ? date : latest),
    null,
  );
}

export function buildProfileRecords({ longestStreak, rooms }: ProfileRecordsInput): ProfileRecord[] {
  const finishedRooms = rooms.filter((room) => room.decorations.length >= ROOM_SLOT_COUNT);
  const roomsFinishedDate = latestDate(
    finishedRooms
      .map((room) => latestDate(room.decorations.map((decoration) => decoration.earnedLocalDate)))
      .filter((date): date is string => date != null),
  );

  return [
    {
      key: 'longestStreak',
      value: longestStreak,
      localDate: null,
      locked: longestStreak <= 0,
    },
    {
      key: 'roomsFinished',
      value: finishedRooms.length,
      localDate: finishedRooms.length > 0 ? roomsFinishedDate : null,
      locked: finishedRooms.length === 0,
    },
  ];
}
