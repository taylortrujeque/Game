import { describe, expect, it } from "vitest";
import {
  createGuardian,
  guardianCanHit,
  HIT_RECOVERY_SECONDS,
  isSafeFromGuardian,
  updateGuardian,
} from "./guardian";

describe("Bowser patrol", () => {
  it("roams every film world and leaves the hub peaceful", () => {
    expect(createGuardian("hub")).toBeNull();
    for (const world of ["jungle", "galaxy", "castle"] as const) {
      const guardian = createGuardian(world)!;
      const before = { x: guardian.x, y: guardian.y };
      updateGuardian(guardian, { x: 640, y: 720 }, world, 0.1, () => false);
      expect(guardian.mode).toBe("patrol");
      expect({ x: guardian.x, y: guardian.y }).not.toEqual(before);
    }
  });
  it("pursues a nearby player and returns to patrol when the player reaches safety", () => {
    const guardian = createGuardian("jungle")!;
    const player = { x: 630, y: 560 };
    const before = Math.hypot(player.x - guardian.x, player.y - guardian.y);
    updateGuardian(guardian, player, "jungle", 0.1, () => false);
    expect(guardian.mode).toBe("chase");
    expect(
      Math.hypot(player.x - guardian.x, player.y - guardian.y),
    ).toBeLessThan(before);
    updateGuardian(guardian, { x: 360, y: 380 }, "jungle", 0.1, () => false);
    expect(guardian.mode).toBe("patrol");
    expect(isSafeFromGuardian({ x: 360, y: 380 }, "jungle")).toBe(true);
    expect(isSafeFromGuardian({ x: 640, y: 720 }, "jungle")).toBe(true);
  });
  it("respects solid scenery and pauses movement after a hit", () => {
    const guardian = createGuardian("jungle")!;
    updateGuardian(guardian, { x: 630, y: 560 }, "jungle", 0.1, () => true);
    expect(guardian.x).toBe(550);
    expect(guardian.y).toBe(520);
    guardian.stunTime = 0.8;
    updateGuardian(guardian, { x: 630, y: 560 }, "jungle", 0.1, () => false);
    expect(guardian.stunTime).toBeCloseTo(0.7);
    expect(guardian.x).toBe(550);
    expect(guardian.y).toBe(520);
  });
  it("lets Mario jump over Bowser and prevents damage during recovery or at a question block", () => {
    const guardian = createGuardian("jungle")!;
    const player = { x: guardian.x, y: guardian.y };
    expect(guardianCanHit(guardian, player, "jungle", 0, 0)).toBe(true);
    expect(guardianCanHit(guardian, player, "jungle", 22, 0)).toBe(false);
    expect(guardianCanHit(guardian, player, "jungle", 53, 0)).toBe(false);
    expect(
      guardianCanHit(guardian, player, "jungle", 0, HIT_RECOVERY_SECONDS),
    ).toBe(false);
    guardian.x = 360;
    guardian.y = 380;
    expect(guardianCanHit(guardian, { x: 360, y: 380 }, "jungle", 0, 0)).toBe(
      false,
    );
  });
});
