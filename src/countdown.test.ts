import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionCountdown, QUESTION_TIME_LIMIT_MS } from "./countdown";

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("five-second question countdown", () => {
  it("expires once after five seconds instead of deducting repeatedly", () => {
    vi.useFakeTimers();
    let now = 0;
    const onTick = vi.fn(),
      onExpire = vi.fn();
    const timer = new QuestionCountdown({ onTick, onExpire }, () => now);
    timer.start();
    expect(onTick).toHaveBeenLastCalledWith(5000);
    now = 4999;
    vi.advanceTimersByTime(50);
    expect(onExpire).not.toHaveBeenCalled();
    now = 5000;
    vi.advanceTimersByTime(50);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenLastCalledWith(0);
    vi.advanceTimersByTime(20_000);
    expect(timer.trySubmit()).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
  it("accepts an answer before the deadline and cancels its pending timeout", () => {
    vi.useFakeTimers();
    let now = 0;
    const onExpire = vi.fn();
    const timer = new QuestionCountdown(
      { onTick: vi.fn(), onExpire },
      () => now,
    );
    timer.start();
    now = QUESTION_TIME_LIMIT_MS - 1;
    expect(timer.trySubmit()).toBe(true);
    now = 30_000;
    vi.advanceTimersByTime(30_000);
    expect(timer.trySubmit()).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();
  });
  it("rejects a late answer even when the browser delayed every timer callback", () => {
    vi.useFakeTimers();
    let now = 0;
    const onExpire = vi.fn();
    const timer = new QuestionCountdown(
      { onTick: vi.fn(), onExpire },
      () => now,
    );
    timer.start();
    now = 10_000;
    expect(timer.trySubmit()).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
  it("cancels abandoned questions and gives a retry a fresh five seconds", () => {
    vi.useFakeTimers();
    let now = 0;
    const onTick = vi.fn(),
      onExpire = vi.fn();
    const timer = new QuestionCountdown({ onTick, onExpire }, () => now);
    timer.start();
    timer.stop();
    now = 20_000;
    vi.advanceTimersByTime(20_000);
    expect(onExpire).not.toHaveBeenCalled();
    timer.start();
    expect(onTick).toHaveBeenLastCalledWith(5000);
    now += 4000;
    expect(timer.trySubmit()).toBe(true);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
