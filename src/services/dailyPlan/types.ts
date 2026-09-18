export interface DailyPlanSchedule {
  version: 1;
  timeMode: 'device_local';
  actions: {
    session: string;
    handPicked: string;
    /**
     * The third exercise's hour, used from the week the plan starts asking for
     * three. Stored whether or not today uses it, so the time does not appear
     * out of nowhere on the day the plan grows.
     */
    windDown: string;
  };
}

export const DEFAULT_DAILY_PLAN_SCHEDULE: DailyPlanSchedule = {
  version: 1,
  timeMode: 'device_local',
  actions: {
    session: '08:00',
    handPicked: '13:00',
    windDown: '21:00',
  },
};
