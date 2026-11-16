export const QUESTION_TIME_LIMIT_MS = 5_000;

interface CountdownEvents {
  onTick: (remainingMs: number) => void;
  onExpire: () => void;
}

export class QuestionCountdown {
  private deadline = 0;
  private running = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private events: CountdownEvents,
    private now: () => number = () => performance.now(),
  ) {}

  start() {
    this.stop();
    this.deadline = this.now() + QUESTION_TIME_LIMIT_MS;
    this.running = true;
    this.events.onTick(QUESTION_TIME_LIMIT_MS);
    this.interval = setInterval(() => this.refresh(), 50);
  }

  stop() {
    this.running = false;
    if (this.interval !== null) clearInterval(this.interval);
    this.interval = null;
  }

  refresh() {
    if (!this.running) return;
    const remaining = Math.max(0, this.deadline - this.now());
    if (remaining === 0) this.expire();
    else this.events.onTick(remaining);
  }

  trySubmit(): boolean {
    if (!this.running) return false;
    const remaining = this.deadline - this.now();
    // Check the deadline here too: a background tab may delay interval callbacks.
    if (remaining <= 0) {
      this.expire();
      return false;
    }
    this.events.onTick(remaining);
    this.stop();
    return true;
  }

  private expire() {
    if (!this.running) return;
    this.stop();
    this.events.onTick(0);
    this.events.onExpire();
  }
}
