import { bowser, label, MAP_H, MAP_W, rounded, shadow, star } from "./art";
import type { Extra, Hazard } from "./arcade";
import type { BossBattle } from "./boss";
type Ctx = CanvasRenderingContext2D;

export function drawExtra(
  ctx: Ctx,
  extra: Extra,
  time: number,
  nearby: boolean,
) {
  const bob = Math.sin(time * 3 + extra.x) * 4;
  const x = extra.x,
    y = extra.y + bob;
  shadow(ctx, x, extra.y + 4, 17, 6);
  if (extra.kind === "star") {
    ctx.fillStyle = "#fff2a72b";
    ctx.beginPath();
    ctx.arc(x, y - 17, 29, 0, Math.PI * 2);
    ctx.fill();
    star(ctx, x, y - 18, 19, "#fff183");
    if (nearby) label(ctx, x, y + 28, "8s SUPER STAR", "#fff1ad", "#8b7544e8");
  } else if (extra.kind === "reel") {
    ctx.fillStyle = "#c79841";
    ctx.beginPath();
    ctx.arc(x, y - 14, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffde7e";
    ctx.beginPath();
    ctx.arc(x - 1, y - 16, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9e8246";
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + time * 0.6;
      ctx.beginPath();
      ctx.arc(
        x - 1 + Math.cos(a) * 8,
        y - 16 + Math.sin(a) * 8,
        4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = "#fff5cc";
    ctx.fillRect(x - 3, y - 18, 4, 4);
    if (nearby)
      label(ctx, x, y + 24, "HIDDEN FILM REEL", "#fff1ad", "#8b7544e8");
  } else if (extra.kind === "mushroom") {
    rounded(ctx, x - 9, y - 18, 18, 23, 5, "#fff0ca");
    ctx.fillStyle = "#da7867";
    ctx.beginPath();
    ctx.ellipse(x, y - 20, 23, 17, 0, Math.PI, 0);
    ctx.lineTo(x + 23, y - 11);
    ctx.lineTo(x - 23, y - 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff0ca";
    ctx.fillRect(x - 14, y - 29, 8, 9);
    ctx.fillRect(x + 3, y - 34, 9, 9);
    ctx.fillRect(x + 10, y - 19, 8, 8);
    ctx.fillStyle = "#786146";
    ctx.fillRect(x - 5, y - 7, 2, 5);
    ctx.fillRect(x + 3, y - 7, 2, 5);
    if (nearby)
      label(ctx, x, y + 25, "1-UP · RESTORE A HEART", "#ffefcf", "#9c6250e8");
  } else if (extra.kind === "crate") {
    ctx.fillStyle = "#745a45";
    ctx.fillRect(x - 22, extra.y - 39, 44, 42);
    ctx.fillStyle = "#b68a5d";
    ctx.fillRect(x - 22, extra.y - 43, 40, 40);
    ctx.fillStyle = "#dcba7c";
    ctx.fillRect(x - 19, extra.y - 40, 34, 5);
    ctx.fillRect(x - 19, extra.y - 40, 5, 34);
    ctx.fillRect(x - 19, extra.y - 11, 34, 5);
    ctx.fillRect(x + 10, extra.y - 40, 5, 34);
    ctx.fillStyle = "#6a655c";
    ctx.fillRect(x - 8, extra.y - 32, 16, 20);
    ctx.fillStyle = "#d8d4c6";
    ctx.fillRect(x - 4, extra.y - 32, 4, 14);
    ctx.fillRect(x + 4, extra.y - 32, 4, 14);
    if (nearby)
      label(
        ctx,
        x,
        extra.y + 26,
        "JUMP / DASH TO SMASH",
        "#fff1d1",
        "#88674be8",
      );
  }
}

export function drawHazard(ctx: Ctx, hazard: Hazard, time: number) {
  const { x, y } = hazard;
  if (hazard.kind === "laser") {
    for (const side of [-1, 1]) {
      rounded(ctx, x + side * 125 - 9, y - 15, 18, 29, 4, "#666380");
      ctx.fillStyle = hazard.active ? "#f6cb8c" : "#a9a5ca";
      ctx.fillRect(x + side * 125 - 4, y - 8, 8, 15);
    }
    if (hazard.active || hazard.warning) {
      ctx.strokeStyle = hazard.active ? "#f4b17e" : "#e4c9ad88";
      ctx.lineWidth = hazard.active ? 7 : 2;
      ctx.setLineDash(hazard.active ? [] : [5, 6]);
      ctx.beginPath();
      ctx.moveTo(x - 120, y);
      ctx.lineTo(x + 120, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (hazard.active) {
        ctx.strokeStyle = "#fff0cf";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 120, y);
        ctx.lineTo(x + 120, y);
        ctx.stroke();
      }
    }
  } else if (hazard.kind === "boulder") {
    shadow(ctx, x, y + 5, 25, 8);
    ctx.save();
    ctx.translate(x, y - 15);
    ctx.rotate(time * 1.7);
    rounded(ctx, -21, -21, 42, 42, 11, "#737c6a");
    rounded(ctx, -17, -20, 31, 31, 8, "#a2aa88");
    ctx.strokeStyle = "#74826c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -17);
    ctx.lineTo(-4, -3);
    ctx.lineTo(11, -4);
    ctx.moveTo(-4, -3);
    ctx.lineTo(-7, 13);
    ctx.stroke();
    ctx.restore();
  } else {
    shadow(ctx, x, y + 5, 17, 6);
    ctx.fillStyle = "#c7afe83d";
    ctx.beginPath();
    ctx.arc(x, y - 14, 25 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
    ctx.fill();
    star(ctx, x, y - 14, 15, "#c8b0e5", false);
    ctx.fillStyle = "#f1e2ff";
    ctx.fillRect(x - 3, y - 21, 6, 13);
    ctx.fillRect(x - 7, y - 17, 14, 4);
  }
}

export function createArenaTerrain(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_W;
  canvas.height = MAP_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#493843";
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  for (let y = 0; y < MAP_H; y += 48)
    for (let x = 0; x < MAP_W; x += 48) {
      ctx.fillStyle = (x + y) % 96 ? "#5c3e43" : "#604348";
      ctx.fillRect(x + 2, y + 2, 43, 43);
      if ((x * 3 + y) % 240 === 0) {
        ctx.fillStyle = "#e28d54";
        ctx.fillRect(x + 11, y + 15, 17, 3);
        ctx.fillRect(x + 25, y + 19, 9, 3);
      }
    }
  rounded(ctx, 397, 256, 486, 544, 31, "#e1a65d");
  rounded(ctx, 409, 267, 462, 522, 23, "#584952");
  for (let y = 280; y < 780; y += 40)
    for (let x = 420; x < 860; x += 40) {
      ctx.fillStyle = (x + y) % 80 ? "#82706e" : "#78676a";
      ctx.fillRect(x + 1, y + 1, 38, 38);
    }
  ctx.strokeStyle = "#b69b7e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(640, 444, 137, 108, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#9d8280";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 444, 126, 98, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const x of [390, 890])
    for (const y of [320, 680]) {
      rounded(ctx, x - 16, y - 35, 32, 48, 4, "#65515a");
      ctx.fillStyle = "#e5a862";
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 32);
      ctx.lineTo(x - 9, y - 61);
      ctx.lineTo(x, y - 50);
      ctx.lineTo(x + 5, y - 71);
      ctx.lineTo(x + 15, y - 39);
      ctx.fill();
      ctx.fillStyle = "#ffdb8a";
      ctx.fillRect(x - 5, y - 48, 10, 19);
    }
  label(
    ctx,
    640,
    242,
    "THE FINAL CUT · BOWSER’S PREMIERE",
    "#ffe5b0",
    "#6d4653",
  );
  label(
    ctx,
    640,
    813,
    "DODGE THE FIRE · JUMP WHEN HE’S TIRED",
    "#ffe5b0",
    "#6d4653",
  );
  return canvas;
}

export function drawBoss(ctx: Ctx, boss: BossBattle, time: number) {
  if (boss.phase === "defeated") {
    star(ctx, boss.x, boss.y - 25 + Math.sin(time * 3) * 5, 38);
    return;
  }
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.scale(1.5, 1.5);
  bowser(
    ctx,
    0,
    0,
    time,
    1,
    boss.phase === "attack",
    boss.phase === "tired" || boss.phase === "hit",
  );
  ctx.restore();
  if (boss.phase === "warning") {
    ctx.strokeStyle = "#f2ab7d";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(
      boss.x,
      boss.y + 7,
      66 + Math.sin(time * 10) * 5,
      27,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.setLineDash([]);
    label(
      ctx,
      boss.x,
      boss.y - 105,
      "! FIRE INCOMING !",
      "#ffedc1",
      "#ae604ae8",
    );
  } else if (boss.phase === "tired") {
    label(
      ctx,
      boss.x,
      boss.y - 105,
      "NOW! JUMP ON BOWSER!",
      "#fff0a4",
      "#6b8255ee",
    );
    for (let i = 0; i < 3; i++)
      star(
        ctx,
        boss.x + Math.cos(time * 3 + i * 2) * 35,
        boss.y - 84 + Math.sin(time * 3 + i * 2) * 8,
        7,
        "#ffe48a",
        false,
      );
  }
  for (const shot of boss.fireballs) {
    ctx.fillStyle = "#e1815740";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e88b55";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe2a0";
    ctx.beginPath();
    ctx.arc(shot.x - 2, shot.y - 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
