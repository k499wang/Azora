function sinc(value: number): number {
  if (value === 0) return 1;
  return Math.sin(Math.PI * value) / (Math.PI * value);
}

export class Filter {
  private readonly bandpassFilter: number[];
  private readonly lowpassFilter: number[];
  private readonly highpassFilter: number[];
  private readonly inputI: number[];
  private readonly outputI: number[];
  private readonly input: number[];

  constructor() {
    this.bandpassFilter = this.generateBandPassFilter();
    this.lowpassFilter = this.generateLowPassFilter();
    this.highpassFilter = this.generateHighPassFilter();
    this.inputI = new Array(101).fill(0);
    this.outputI = new Array(101).fill(0);
    this.input = [0, 0, 0];
  }

  processValue(value: number): number {
    this.inputI[0] = value;
    let outputValue = 0;
    for (let i = 0; i < 101; i++) {
      outputValue += this.bandpassFilter[i] * this.inputI[i];
    }

    for (let i = 100; i > 0; i--) {
      this.inputI[i] = this.inputI[i - 1];
    }

    this.outputI[0] = outputValue;
    let result = 0;
    for (let i = 0; i < 101; i++) {
      result += this.lowpassFilter[i] * this.outputI[i];
    }

    for (let i = 100; i > 0; i--) {
      this.outputI[i] = this.outputI[i - 1];
    }

    this.input[0] = result;
    let finalValue = 0;
    for (let i = 0; i < 3; i++) {
      finalValue += this.highpassFilter[i] * this.input[i];
    }

    for (let i = 2; i > 0; i--) {
      this.input[i] = this.input[i - 1];
    }

    return finalValue;
  }

  reset(): void {
    this.inputI.fill(0);
    this.outputI.fill(0);
    this.input.fill(0);
  }

  private generateBandPassFilter(): number[] {
    const bandwidth = 0.1;
    const centerFreq = 100;
    const sampleRate = 30;
    const filter: number[] = [];

    for (let i = 0; i < 101; i++) {
      const m = i - 50;
      filter.push(
        2 * bandwidth * sinc(2 * bandwidth * m) *
          Math.cos((2 * Math.PI * centerFreq * m) / sampleRate),
      );
    }

    return filter;
  }

  private generateLowPassFilter(): number[] {
    const bandwidth = 0.01;
    const filter: number[] = [];

    for (let i = 0; i < 101; i++) {
      const m = i - 50;
      filter.push(2 * bandwidth * sinc(2 * bandwidth * m));
    }

    return filter;
  }

  private generateHighPassFilter(): number[] {
    const bandwidth = 0.01;
    const filter: number[] = [];

    for (let i = 0; i < 3; i++) {
      const m = i - 1;
      filter.push(-2 * bandwidth * sinc(2 * bandwidth * m));
    }
    filter[1] += 1;

    return filter;
  }
}
