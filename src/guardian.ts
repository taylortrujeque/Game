import { worldById, type WorldId } from "./content";

interface Point {
  x: number;
  y: number;
}
export interface Guardian extends Point {
  direction: number;
  waypoint: number;
  mode: "patrol" | "chase";
  stunTime: number;
}

const patrol: Point[] = [
  { x: 550, y: 520 },
  { x: 760, y: 520 },
  { x: 760, y: 620 },
  { x: 550, y: 620 },
];
export const HIT_RECOVERY_SECONDS = 2.4;

export function createGuardian(world: WorldId): Guardian | null {
  if (world === "hub" || world === "finale") return null;
  const start = { jungle: 0, galaxy: 1, castle: 2 }[world];
  return {
    ...patrol[start],
    direction: 1,
    waypoint: (start + 1) % patrol.length,
    mode: "patrol",
    stunTime: 0,
  };
}

export function isSafeFromGuardian(player: Point, world: WorldId): boolean {
  if (world === "hub" || world === "finale") return true;
  // Players can read trivia and use the entrance without being cornered.
  return (
    Math.hypot(player.x - 640, player.y - 740) < 115 ||
    worldById(world).questions.some(
      (question) =>
        Math.hypot(player.x - question.x, player.y - question.y) < 95,
    )
  );
}

export function updateGuardian(
  guardian: Guardian,
  player: Point,
  world: WorldId,
  dt: number,
  blocked: (x: number, y: number) => boolean,
): void {
  if (guardian.stunTime > 0) {
    guardian.stunTime = Math.max(0, guardian.stunTime - dt);
    return;
  }
  const distance = Math.hypot(player.x - guardian.x, player.y - guardian.y);
  const chase =
    !isSafeFromGuardian(player, world) &&
    distance < (guardian.mode === "chase" ? 210 : 145) &&
    Math.hypot(player.x - 655, player.y - 570) < 310;
  if (!chase && guardian.mode === "chase") {
    guardian.waypoint = patrol.reduce(
      (closest, point, index) =>
        Math.hypot(point.x - guardian.x, point.y - guardian.y) <
        Math.hypot(
          patrol[closest].x - guardian.x,
          patrol[closest].y - guardian.y,
        )
          ? index
          : closest,
      0,
    );
  }
  guardian.mode = chase ? "chase" : "patrol";
  if (
    !chase &&
    Math.hypot(
      patrol[guardian.waypoint].x - guardian.x,
      patrol[guardian.waypoint].y - guardian.y,
    ) < 7
  ) {
    guardian.waypoint = (guardian.waypoint + 1) % patrol.length;
  }
  const target = chase ? player : patrol[guardian.waypoint];
  const dx = target.x - guardian.x,
    dy = target.y - guardian.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;
  const step = Math.min(length, (chase ? 96 : 56) * dt);
  const nx = guardian.x + (dx / length) * step;
  const ny = guardian.y + (dy / length) * step;
  const moveX = !blocked(nx, guardian.y);
  if (moveX) guardian.x = nx;
  const moveY = !blocked(guardian.x, ny);
  if (moveY) guardian.y = ny;
  if (Math.abs(dx) > 2) guardian.direction = dx < 0 ? -1 : 1;
  if (!moveX && !moveY && !chase)
    guardian.waypoint = (guardian.waypoint + 1) % patrol.length;
}

export function guardianCanHit(
  guardian: Guardian,
  player: Point,
  world: WorldId,
  jumpHeight: number,
  recoveryTime: number,
): boolean {
  return (
    recoveryTime <= 0 &&
    jumpHeight < 22 &&
    guardian.stunTime <= 0 &&
    !isSafeFromGuardian(player, world) &&
    Math.hypot(player.x - guardian.x, player.y - guardian.y) < 35
  );
}
