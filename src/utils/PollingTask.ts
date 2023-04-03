interface PollingTaskParams {
  interval: number
  task: () => unknown
}

export class PollingTask {
  private task: () => unknown;
  private interval: number;
  private stopFlag = false;
  private advancePromiseResolve: (v?: unknown) => void = () => {};

  public constructor(params: PollingTaskParams) {
    this.task = params.task;
    this.interval = params.interval;
    this.start();
  }

  public stop() {
    this.stopFlag = true;
  }

  public advance() {
    this.advancePromiseResolve?.();
  }

  public changeInterval(interval: number) {
    this.interval = interval;
  }

  private async start() {
    for (;;) {
      if (this.stopFlag) { break; }
      try {
        await this.task();
      } catch (e) {
        console.error(e);
      }
      if (this.stopFlag) { break; }
      await this.waitInterval();
    }
  }

  private async waitInterval() {
    await new Promise((rs) => {
      this.advancePromiseResolve = rs;
      setTimeout(rs, this.interval);
    });
  }
}
