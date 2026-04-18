export const INVALID_PULSE_PERIOD = -1;

const MAX_PERIOD_SECONDS = 1.5;
const MIN_PERIOD_SECONDS = 0.1;
const DEFAULT_UP_FACTOR = 0.5;
const DEFAULT_DOWN_FACTOR = 0.5;
const DEFAULT_AVERAGE_SIZE = 20;
const MAX_PERIODS_TO_STORE = 20;
const INVALID_ENTRY = -100;

export class PulseDetector {
  private readonly upVals: number[];
  private readonly downVals: number[];
  private readonly periodTimes: number[];
  private readonly periods: number[];
  private currentIndex = 0;
  private periodStart = 0;

  constructor() {
    this.upVals = new Array(DEFAULT_AVERAGE_SIZE).fill(INVALID_ENTRY);
    this.downVals = new Array(DEFAULT_AVERAGE_SIZE).fill(INVALID_ENTRY);
    this.periodTimes = new Array(DEFAULT_AVERAGE_SIZE).fill(INVALID_ENTRY);
    this.periods = [];
  }

  addNewValue(newVal: number, time: number): number {
    let averageUp = 0;
    let averageDown = 0;

    for (let i = 0; i < DEFAULT_AVERAGE_SIZE; i++) {
      averageUp += this.upVals[i];
    }
    averageUp /= DEFAULT_AVERAGE_SIZE;

    for (let i = 0; i < DEFAULT_AVERAGE_SIZE; i++) {
      averageDown += this.downVals[i];
    }
    averageDown /= DEFAULT_AVERAGE_SIZE;

    if (newVal > averageUp * DEFAULT_UP_FACTOR) {
      this.upVals[this.currentIndex] = newVal;
      if (newVal > 0.5 * averageUp && this.periodTimes[this.currentIndex] === INVALID_ENTRY) {
        this.periodTimes[this.currentIndex] = time - this.periodStart;
        if (this.periodTimes[this.currentIndex] < MIN_PERIOD_SECONDS * 1000) {
          this.periodTimes[this.currentIndex] = INVALID_ENTRY;
        }
        if (this.periodTimes[this.currentIndex] > MAX_PERIOD_SECONDS * 1000) {
          this.periodTimes[this.currentIndex] = INVALID_ENTRY;
        }
        if (this.periodTimes[this.currentIndex] !== INVALID_ENTRY) {
          this.periods.push(this.periodTimes[this.currentIndex]);
          if (this.periods.length > MAX_PERIODS_TO_STORE) {
            this.periods.shift();
          }
        }
      }
      this.periodStart = time;
      this.currentIndex = (this.currentIndex + 1) % DEFAULT_AVERAGE_SIZE;
      this.periodTimes[this.currentIndex] = INVALID_ENTRY;
      return 1;
    }

    if (newVal < averageDown * DEFAULT_DOWN_FACTOR) {
      this.downVals[this.currentIndex] = newVal;
      return -1;
    }

    return 0;
  }

  getAverage(): number {
    let average = 0;
    let count = 0;

    for (let i = 0; i < DEFAULT_AVERAGE_SIZE; i++) {
      if (this.periodTimes[i] !== INVALID_ENTRY && this.periodTimes[i] !== 0) {
        average += this.periodTimes[i];
        count += 1;
      }
    }

    if (count > 2) {
      return average / count / 1000;
    }

    return INVALID_PULSE_PERIOD;
  }

  reset(): void {
    this.upVals.fill(INVALID_ENTRY);
    this.downVals.fill(INVALID_ENTRY);
    this.periodTimes.fill(INVALID_ENTRY);
    this.periods.length = 0;
    this.currentIndex = 0;
    this.periodStart = 0;
  }
}
