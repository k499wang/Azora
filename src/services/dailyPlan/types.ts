export interface DailyPlanSchedule {
  version: 1;
  timeMode: 'device_local';
  actions: {
    session: string;
    handPicked: string;
    checkIn: string;
  };
}

export const DEFAULT_DAILY_PLAN_SCHEDULE: DailyPlanSchedule = {
  version: 1,
  timeMode: 'device_local',
  actions: {
    session: '08:00',
    handPicked: '13:00',
    checkIn: '18:00',
  },
};
