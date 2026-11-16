export type BossPhase = "warning" | "attack" | "tired" | "hit" | "defeated";
export interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}
export interface BossBattle {
  x: number;
  y: number;
  health: number;
  phase: BossPhase;
  remaining: number;
  fireballs: Fireball[];
  volleys: number;
}
export const createBoss = (): BossBattle => ({
  x: 640,
  y: 430,
  health: 3,
  phase: "warning",
  remaining: 1.5,
  fireballs: [],
  volleys: 0,
});

export function updateBoss(
  boss: BossBattle,
  player: { x: number; y: number },
  dt: number,
) {
  if (boss.phase === "defeated") return;
  boss.remaining -= dt;
  if (boss.remaining <= 0) {
    if (boss.phase === "warning") {
      boss.phase = "attack";
      boss.remaining = 1.5;
      boss.volleys++;
      const aim = Math.atan2(player.y - boss.y, player.x - boss.x);
      const spread =
        boss.health === 1 ? [-0.8, -0.4, 0, 0.4, 0.8] : [-0.5, 0, 0.5];
      for (const offset of spread)
        boss.fireballs.push({
          x: boss.x,
          y: boss.y + 20,
          vx: Math.cos(aim + offset) * 165,
          vy: Math.sin(aim + offset) * 165,
          age: 0,
        });
    } else if (boss.phase === "attack") {
      boss.phase = "tired";
      boss.remaining = 3.8;
    } else {
      boss.phase = "warning";
      boss.remaining = 1.5;
    }
  }
  for (const shot of boss.fireballs) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.age += dt;
  }
  boss.fireballs = boss.fireballs.filter(
    (shot) =>
      shot.age < 4 &&
      shot.x > 400 &&
      shot.x < 880 &&
      shot.y > 270 &&
      shot.y < 800,
  );
}

export function stompBoss(
  boss: BossBattle,
  player: { x: number; y: number },
  jumpHeight: number,
): boolean {
  if (
    boss.phase !== "tired" ||
    jumpHeight < 26 ||
    Math.hypot(player.x - boss.x, player.y - boss.y) > 57
  )
    return false;
  boss.health--;
  boss.phase = boss.health === 0 ? "defeated" : "hit";
  boss.remaining = 1.1;
  boss.fireballs = [];
  return true;
}
