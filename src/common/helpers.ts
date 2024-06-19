import chalk from 'chalk';

/**
 * Wraps a value in an array if it is not already an array.
 * @param value - The value to wrap.
 * @returns The wrapped value as an array.
 */
export function wrapInArray<T>(value: T[] | T): T[] {
  if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}

/**
 * Timer class for measuring performance.
 */
export class PerformanceTimer {
  private times: number[] = [];
  private startTime: number = 0;

  constructor(public name: string) {}

  start() {
    this.startTime = performance.now();
    return this;
  }

  pause() {
    const endTime = performance.now();
    const elapsed = endTime - this.startTime;
    this.times.push(elapsed);
    return this;
  }

  getTotalTime() {
    return this.times.reduce((total, time) => total + time, 0);
  }

  print() {
    const totalTime = this.getTotalTime();
    console.log(chalk.blue(`Timer: ${chalk.bold(this.name)}`));
    console.log(chalk.yellow(`Proc: ${chalk.bold(this.times.length)}`));
    console.log(chalk.white(`Total time: ${chalk.bold(totalTime.toFixed(2))}ms`));
    console.log(chalk.white(`Average time: ${chalk.bold((totalTime / this.times.length).toFixed(2))}ms`));
    // console.log(chalk.red(`Max time: ${chalk.bold(Math.max(...this.times).toFixed(2))}ms`));
    // console.log(chalk.green(`Min time: ${chalk.bold(Math.min(...this.times).toFixed(2))}ms`));
    console.log();
  }

  static printAll() {
    Object.keys(PerformanceTimer.timers).forEach((name) => {
      PerformanceTimer.timers[name].print();
    });
    if (Object.keys(PerformanceTimer.timers).length === 0) {
      console.log(chalk.red('No timers to print.'));
    }
  }

  static timer(name: string) {
    if (!PerformanceTimer.timers[name]) {
      PerformanceTimer.timers[name] = new PerformanceTimer(name);
    }
    return PerformanceTimer.timers[name];
  }

  static timers: Record<string, PerformanceTimer> = {};
}
