import {
  extrasForWorld,
  hazardsForWorld,
  touchesHazard,
  DASH_DURATION,
  DASH_COOLDOWN,
  STAR_DURATION,
  MAGNET_DURATION,
} from "./arcade";
import {
  createArenaTerrain,
  drawBoss,
  drawExtra,
  drawHazard,
} from "./arcade-art";
import { createBoss, stompBoss, updateBoss, type BossBattle } from "./boss";
import {
  coin,
  createTerrain,
  label,
  mario,
  bowser,
  palettes,
  portal,
  questionBlock,
  star,
  MAP_H,
  MAP_W,
  shadow,
  rounded,
} from "./art";
import {
  coinsForWorld,
  isFilmWorld,
  portals,
  worldById,
  type Question,
  type WorldId,
} from "./content";
import {
  collectCoin,
  claimExtra,
  winFinale,
  starCount,
  earnedStar,
  isGameOver,
  takeEnemyHit,
  type Progress,
} from "./state";
import {
  createGuardian,
  guardianCanHit,
  HIT_RECOVERY_SECONDS,
  updateGuardian,
  type Guardian,
} from "./guardian";

export type Interaction =
  | {
      type: "portal";
      world: "jungle" | "galaxy" | "castle";
      label: string;
      x: number;
      y: number;
    }
  | {
      type: "question";
      question: Question;
      label: string;
      x: number;
      y: number;
    }
  | { type: "exit" | "palace" | "toad"; label: string; x: number; y: number };

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  color: string;
}
export interface ArcadeStatus {
  dashPercent: number;
  power: string;
  powerSeconds: number;
  combo: number;
  bossHealth: number;
  bossPhase: string;
}
interface GameOptions {
  canvas: HTMLCanvasElement;
  progress: Progress;
  onInteract: (interaction: Interaction) => void;
  onNearby: (interaction: Interaction | null) => void;
  onCollect: () => void;
  onJump: () => void;
  onEnemyHit: (cause: string) => void;
  onArcadeEvent: (message: string) => void;
  onArcadeStatus: (status: ArcadeStatus) => void;
  onVictory: () => void;
}

export class Game {
  world: WorldId = "hub";
  paused = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private terrain = new Map<WorldId, HTMLCanvasElement>();
  private player = { x: 640, y: 706, direction: 1 };
  private guardian: Guardian | null = null;
  private recoveryTime = 0;
  private starTime = 0;
  private magnetTime = 0;
  private dashTime = 0;
  private dashCooldown = 0;
  private facing = { x: 1, y: 0 };
  private dashVector = { x: 1, y: 0 };
  private coinChain = 0;
  private chainTime = 0;
  private shakeTime = 0;
  private statusTime = 0;
  private boss: BossBattle | null = null;
  private floaters: {
    x: number;
    y: number;
    text: string;
    color: string;
    age: number;
  }[] = [];
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private width = 0;
  private height = 0;
  private scale = 1;
  private jumpTime = 0;
  private jumpHeight = 0;
  private time = 0;
  private lastTime = 0;
  private nearby: Interaction | null = null;
  private particles: Particle[] = [];
  private lastNearbyId = "";
  private animation = 0;
  private observer: ResizeObserver;

  constructor(private options: GameOptions) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d")!;
    for (const id of [
      "hub",
      "jungle",
      "galaxy",
      "castle",
      "finale",
    ] as WorldId[])
      this.terrain.set(
        id,
        id === "finale" ? createArenaTerrain() : createTerrain(id),
      );
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.canvas);
    this.resize();
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
    window.addEventListener("blur", this.clearInput);
    document.addEventListener("visibilitychange", this.clearInput);
    this.animation = requestAnimationFrame(this.frame);
  }

  private resize() {
    const box = this.canvas.getBoundingClientRect();
    this.width = box.width;
    this.height = box.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(box.width * dpr);
    this.canvas.height = Math.round(box.height * dpr);
    this.scale =
      this.world === "finale"
        ? this.width < 700
          ? Math.min(0.78, this.width / 460)
          : Math.min(this.width / 850, this.height / 650)
        : this.width < 700
          ? 0.98
          : Math.max(0.64, Math.min(this.width / 1190, this.height / 790));
  }

  private keydown = (event: KeyboardEvent) => {
    if (this.paused || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "shift") {
      event.preventDefault();
      if (!event.repeat) this.dash();
      return;
    }
    if (
      key === " " &&
      event.target instanceof HTMLElement &&
      event.target.closest("button, a, input, select, textarea")
    )
      return;
    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
        "w",
        "a",
        "s",
        "d",
        "e",
      ].includes(key)
    ) {
      event.preventDefault();
      this.keys.add(key);
      if (key === " " && !event.repeat) this.jump();
      if (key === "e" && !event.repeat) this.interact();
    }
  };
  private keyup = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };
  clearInput = () => {
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
  };
  setStick(x: number, y: number) {
    this.stick = { x, y };
  }

  setPaused(paused: boolean) {
    this.paused = paused || isGameOver(this.options.progress);
    this.clearInput();
  }

  enter(world: WorldId) {
    if (
      isGameOver(this.options.progress) ||
      (world === "finale" && starCount(this.options.progress) < 3)
    )
      return;
    this.world = world;
    this.player = { x: 640, y: world === "hub" ? 706 : 720, direction: 1 };
    this.jumpHeight = 0;
    this.jumpTime = 0;
    this.guardian = createGuardian(world);
    this.boss = world === "finale" ? createBoss() : null;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.coinChain = 0;
    this.chainTime = 0;
    this.floaters = [];
    this.resize();
    this.recoveryTime = 1.2;
    this.particles = [];
    this.nearby = null;
    this.lastNearbyId = "";
    this.clearInput();
    this.updateNearby();
  }

  resetRunEffects() {
    this.starTime = 0;
    this.magnetTime = 0;
    this.dashCooldown = 0;
    this.coinChain = 0;
  }

  dash() {
    if (
      this.paused ||
      isGameOver(this.options.progress) ||
      this.dashCooldown > 0
    )
      return;
    this.dashTime = DASH_DURATION;
    this.dashCooldown = DASH_COOLDOWN;
    const x =
      (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
      (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0) +
      this.stick.x;
    const y =
      (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) -
      (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0) +
      this.stick.y;
    const length = Math.hypot(x, y);
    this.dashVector =
      length > 0.1 ? { x: x / length, y: y / length } : { ...this.facing };
    this.addBurst(this.player.x, this.player.y, "#e4f1dc", 5);
  }

  private addBurst(x: number, y: number, color: string, count = 12) {
    for (let i = 0; i < count; i++)
      this.particles.push({
        x,
        y: y - 15,
        vx: (Math.random() - 0.5) * 140,
        vy: -30 - Math.random() * 120,
        age: 0,
        color,
      });
  }
  private float(
    text: string,
    color = "#fff1bd",
    x = this.player.x,
    y = this.player.y - 45,
  ) {
    this.floaters.push({ x, y, text, color, age: 0 });
  }
  private hit(cause: string) {
    takeEnemyHit(this.options.progress);
    this.shakeTime = 0.25;
    const health = this.boss?.health;
    if (isGameOver(this.options.progress)) this.setPaused(true);
    else {
      this.enter(this.world);
      this.recoveryTime = HIT_RECOVERY_SECONDS;
      if (this.boss && health !== undefined) this.boss.health = health;
    }
    this.options.onEnemyHit(cause);
  }

  jump() {
    if (this.paused || isGameOver(this.options.progress) || this.jumpTime > 0)
      return;
    this.jumpTime = 0.001;
    this.options.onJump();
  }

  interact() {
    if (!this.paused && !isGameOver(this.options.progress) && this.nearby)
      this.options.onInteract(this.nearby);
  }

  celebrate() {
    for (let i = 0; i < 60; i++)
      this.particles.push({
        x: this.player.x,
        y: this.player.y - 20,
        vx: (Math.random() - 0.5) * 250,
        vy: -70 - Math.random() * 210,
        age: Math.random() * 0.3,
        color: ["#ffda69", "#fff2c9", "#d77e77", "#78b2a0"][i % 4],
      });
  }

  private blocked(x: number, y: number, jumpHeight = this.jumpHeight): boolean {
    if (this.world === "finale")
      return x < 426 || x > 854 || y < 280 || y > 775;
    if (x < 112 || x > MAP_W - 112 || y < 215 || y > MAP_H - 58) return true;
    if (this.world === "hub" || this.world === "castle") {
      if (x > 474 && x < 806 && y > 218 && y < 328) return true;
    }
    if (this.world === "hub" && Math.hypot(x - 640, (y - 452) * 1.55) < 77)
      return true;
    const pondX = this.world === "hub" ? 1070 : 185;
    if (Math.hypot((x - pondX) / 1.2, y - 621) < 78) return true;
    if (jumpHeight < 14) {
      if (
        extrasForWorld(this.world).some(
          (extra) =>
            extra.kind === "crate" &&
            !this.options.progress.extras.includes(extra.id) &&
            Math.abs(x - extra.x) < 27 &&
            Math.abs(y - extra.y + 14) < 28,
        )
      )
        return true;
      for (const [bx, by] of [
        [450, 330],
        [820, 260],
        [1050, 325],
        [460, 580],
        [760, 760],
        [1120, 790],
        [175, 450],
        [176, 800],
      ]) {
        if (Math.abs(x - bx) < 32 && Math.abs(y - by + 9) < 22) return true;
      }
    }
    return false;
  }

  private interactions(): Interaction[] {
    if (this.world === "hub")
      return [
        ...portals.map((p) => ({
          type: "portal" as const,
          ...p,
          label: `Enter ${worldById(p.world).name}`,
        })),
        { type: "palace", x: 640, y: 342, label: "Visit the Picture Palace" },
        { type: "toad", x: 530, y: 598, label: "Talk to Toad" },
      ];
    if (this.world === "finale")
      return [{ type: "exit", x: 640, y: 780, label: "Retreat to the hub" }];
    return [
      ...worldById(this.world)
        .questions.filter(
          (question) => !this.options.progress.answered.includes(question.id),
        )
        .map((question) => ({
          type: "question" as const,
          question,
          x: question.x,
          y: question.y,
          label: question.title,
        })),
      { type: "exit", x: 640, y: 780, label: "Return to the hub" },
    ];
  }

  private updateNearby() {
    const candidates = this.interactions()
      .map((interaction) => ({
        interaction,
        distance: Math.hypot(
          interaction.x - this.player.x,
          interaction.y - this.player.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
    this.nearby =
      candidates[0]?.distance < 87 ? candidates[0].interaction : null;
    const id = this.nearby
      ? `${this.nearby.type}:${this.nearby.label}`
      : "none";
    if (id !== this.lastNearbyId) {
      this.lastNearbyId = id;
      this.options.onNearby(this.nearby);
    }
  }

  private update(dt: number) {
    this.time += dt;
    this.recoveryTime = Math.max(0, this.recoveryTime - dt);
    this.starTime = Math.max(0, this.starTime - dt);
    this.magnetTime = Math.max(0, this.magnetTime - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.chainTime = Math.max(0, this.chainTime - dt);
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (!this.chainTime) this.coinChain = 0;
    if (this.jumpTime > 0) {
      this.jumpTime += dt;
      this.jumpHeight =
        Math.sin(Math.min(this.jumpTime / 0.62, 1) * Math.PI) * 53;
      if (this.jumpTime >= 0.62) {
        this.jumpTime = 0;
        this.jumpHeight = 0;
      }
    }
    const x =
      (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
      (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0) +
      this.stick.x;
    const y =
      (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) -
      (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0) +
      this.stick.y;
    const length = Math.max(1, Math.hypot(x, y));
    if (Math.hypot(x, y) > 0.1) this.facing = { x: x / length, y: y / length };
    const dashing = this.dashTime > 0;
    const speed = dashing ? 545 : 218;
    const nx =
      this.player.x + (dashing ? this.dashVector.x : x / length) * speed * dt;
    const ny =
      this.player.y + (dashing ? this.dashVector.y : y / length) * speed * dt;
    if (!this.blocked(nx, this.player.y, dashing ? 30 : this.jumpHeight))
      this.player.x = nx;
    if (!this.blocked(this.player.x, ny, dashing ? 30 : this.jumpHeight))
      this.player.y = ny;
    if (Math.abs(x) > 0.05) this.player.direction = x < 0 ? -1 : 1;
    if (dashing) this.addBurst(this.player.x, this.player.y, "#d0e7df", 1);
    for (const item of coinsForWorld(this.world)) {
      if (
        !this.options.progress.collected.includes(item.id) &&
        Math.hypot(item.x - this.player.x, item.y - this.player.y) <
          (this.magnetTime > 0 ? 145 : 27)
      ) {
        collectCoin(this.options.progress, item.id);
        this.coinChain++;
        this.chainTime = 1.7;
        if (this.coinChain % 5 === 0) {
          this.options.progress.bonusCoins += 2;
          this.float(`COMBO ×${this.coinChain} +2`);
        }
        this.options.onCollect();
        this.addBurst(item.x, item.y, "#ffe4a0", 6);
      }
    }
    for (const extra of extrasForWorld(this.world)) {
      const distance = Math.hypot(
        extra.x - this.player.x,
        extra.y - this.player.y,
      );
      if (
        this.options.progress.extras.includes(extra.id) ||
        distance > (extra.kind === "crate" ? 46 : 25)
      )
        continue;
      if (extra.kind === "crate" && this.jumpHeight < 24 && !dashing) continue;
      const reward = claimExtra(this.options.progress, extra.id);
      if (!reward) continue;
      if (reward.kind === "star") this.starTime = STAR_DURATION;
      if (reward.kind === "crate") this.magnetTime = MAGNET_DURATION;
      this.addBurst(
        extra.x,
        extra.y,
        extra.kind === "reel" ? "#ffda7c" : "#e6d7af",
        20,
      );
      this.float(
        reward.setComplete
          ? "REEL SET! +12"
          : reward.healed
            ? "+1 HEART"
            : reward.coins
              ? `+${reward.coins} COINS`
              : "SUPER STAR!",
        "#fff0a4",
      );
      this.options.onArcadeEvent(
        reward.kind === "star"
          ? "SUPER STAR! 8 seconds of invincibility. Run into Bowser!"
          : reward.kind === "crate"
            ? "Crate smashed! +3 coins and a 10-second coin magnet."
            : reward.setComplete
              ? "All 3 film reels found! +10 bonus coins and a heart restored if needed."
              : reward.kind === "mushroom"
                ? reward.healed
                  ? "1-UP! One heart restored."
                  : "Hearts full! +5 bonus coins."
                : "Hidden film reel! +2 coins. Find all 3 for a bonus.",
      );
    }
    const protectedNow = this.recoveryTime > 0 || this.starTime > 0 || dashing;
    if (this.guardian) {
      updateGuardian(this.guardian, this.player, this.world, dt, (gx, gy) =>
        this.blocked(gx, gy, 0),
      );
      const near =
        Math.hypot(
          this.player.x - this.guardian.x,
          this.player.y - this.guardian.y,
        ) < 44;
      if (
        near &&
        this.guardian.stunTime <= 0 &&
        (this.jumpHeight >= 24 || dashing || this.starTime > 0)
      ) {
        this.guardian.stunTime = 2.2;
        this.shakeTime = 0.12;
        this.addBurst(this.guardian.x, this.guardian.y, "#ffe9a9");
        this.float("BONK!", "#ffe187", this.guardian.x, this.guardian.y - 70);
        if (claimExtra(this.options.progress, `${this.world}-bonk`))
          this.options.onArcadeEvent(
            "Bowser bonked! +3 coins. He’s stunned — make your move!",
          );
      }
      if (
        guardianCanHit(
          this.guardian,
          this.player,
          this.world,
          this.jumpHeight,
          protectedNow ? 1 : 0,
        )
      )
        this.hit("Bowser");
    }
    if (!protectedNow && this.jumpHeight < 22) {
      for (const hazard of hazardsForWorld(this.world, this.time))
        if (touchesHazard(hazard, this.player)) {
          this.hit(hazard.kind);
          break;
        }
    }
    if (this.boss) {
      updateBoss(this.boss, this.player, dt);
      if (stompBoss(this.boss, this.player, this.jumpHeight)) {
        this.jumpTime = 0.12;
        this.shakeTime = 0.25;
        this.addBurst(this.boss.x, this.boss.y, "#ffd47f", 25);
        this.float(
          this.boss.health
            ? `BONK! ${this.boss.health} TO GO`
            : "THAT’S A WRAP!",
          "#ffdf90",
          this.boss.x,
          this.boss.y - 110,
        );
        if (!this.boss.health) {
          winFinale(this.options.progress);
          this.celebrate();
          this.options.onVictory();
        } else
          this.options.onArcadeEvent(
            `Direct hit! ${this.boss.health} more ${this.boss.health === 1 ? "jump" : "jumps"} to beat Bowser.`,
          );
      }
      if (
        this.boss.phase !== "defeated" &&
        !protectedNow &&
        this.jumpHeight < 22 &&
        (this.boss.fireballs.some(
          (shot) =>
            Math.hypot(shot.x - this.player.x, shot.y - this.player.y + 10) <
            25,
        ) ||
          ((this.boss.phase === "warning" || this.boss.phase === "attack") &&
            Math.hypot(
              this.boss.x - this.player.x,
              this.boss.y - this.player.y,
            ) < 48))
      )
        this.hit("fireball");
    }
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.age += dt;
    }
    this.particles = this.particles.filter((p) => p.age < 1.4);
    for (const f of this.floaters) {
      f.y -= dt * 24;
      f.age += dt;
    }
    this.floaters = this.floaters.filter((f) => f.age < 1.3);
    this.statusTime -= dt;
    if (this.statusTime <= 0) {
      this.statusTime = 0.1;
      this.options.onArcadeStatus({
        dashPercent: Math.max(0, 1 - this.dashCooldown / DASH_COOLDOWN),
        power:
          this.starTime > 0
            ? "SUPER STAR"
            : this.magnetTime > 0
              ? "COIN MAGNET"
              : "",
        powerSeconds: Math.ceil(this.starTime || this.magnetTime),
        combo: this.coinChain,
        bossHealth: this.boss?.health ?? 3,
        bossPhase: this.boss?.phase ?? "",
      });
    }
    this.updateNearby();
    return dashing || Math.abs(x) > 0.1 || Math.abs(y) > 0.1;
  }

  private draw(moving: boolean) {
    const ctx = this.ctx,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = palettes[this.world].grass;
    ctx.fillRect(0, 0, this.width, this.height);
    const vw = this.width / this.scale,
      vh = this.height / this.scale;
    const cameraX =
      this.world === "finale"
        ? 640
        : vw >= MAP_W
          ? MAP_W / 2
          : Math.max(vw / 2, Math.min(MAP_W - vw / 2, this.player.x));
    const cameraY =
      this.world === "finale"
        ? 530
        : vh >= MAP_H
          ? MAP_H / 2
          : Math.max(vh / 2, Math.min(MAP_H - vh / 2, this.player.y - 60));
    ctx.save();
    ctx.translate(
      Math.round(this.width / 2 - cameraX * this.scale),
      Math.round(this.height / 2 - cameraY * this.scale),
    );
    ctx.scale(this.scale, this.scale);
    if (this.shakeTime > 0)
      ctx.translate(Math.sin(this.time * 90) * 4, Math.cos(this.time * 80) * 3);
    ctx.drawImage(this.terrain.get(this.world)!, 0, 0);
    if (this.world === "hub") {
      for (const p of portals)
        portal(
          ctx,
          p.x,
          p.y,
          p.world,
          earnedStar(this.options.progress, p.world),
        );
      // Toad is the village’s cheerful film guide.
      shadow(ctx, 530, 601, 14, 5);
      rounded(ctx, 520, 576, 20, 23, 6, "#f3e5c2");
      ctx.fillStyle = "#527c9b";
      ctx.fillRect(518, 585, 7, 12);
      ctx.fillRect(535, 585, 7, 12);
      ctx.fillStyle = "#f9edcf";
      ctx.beginPath();
      ctx.ellipse(530, 566, 22, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ce685b";
      ctx.fillRect(524, 551, 12, 13);
      ctx.fillRect(510, 564, 8, 8);
      ctx.fillRect(542, 564, 8, 8);
      ctx.fillStyle = "#665644";
      ctx.fillRect(525, 578, 2, 5);
      ctx.fillRect(533, 578, 2, 5);
      label(ctx, 530, 628, "TOAD · FILM BUFF", "#f7edcf", "#567054");
    } else if (isFilmWorld(this.world)) {
      worldById(this.world).questions.forEach((question, index) => {
        const done = this.options.progress.answered.includes(question.id);
        questionBlock(ctx, question.x, question.y, done, this.time, index);
        label(
          ctx,
          question.x,
          question.y + 30,
          done
            ? "SCENE COMPLETE"
            : `${index + 1} · ${question.title.toUpperCase()}`,
          done ? "#f5eed5" : "#fff0c9",
          done ? "#60745c" : "#75613ddc",
        );
      });
      ctx.fillStyle = "#e5dbbe";
      ctx.fillRect(608, 767, 64, 24);
      ctx.fillStyle = "#697c65";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("↓", 640, 786);
      label(ctx, 640, 815, "BACK TO THE HUB");
      if (earnedStar(this.options.progress, this.world))
        star(ctx, 640, 540 + Math.sin(this.time * 2) * 6, 28);
    }
    for (const hazard of hazardsForWorld(this.world, this.time))
      drawHazard(ctx, hazard, this.time);
    for (const extra of extrasForWorld(this.world))
      if (!this.options.progress.extras.includes(extra.id))
        drawExtra(
          ctx,
          extra,
          this.time,
          Math.hypot(extra.x - this.player.x, extra.y - this.player.y) < 110,
        );
    if (this.boss) drawBoss(ctx, this.boss, this.time);
    coinsForWorld(this.world).forEach((item, index) => {
      if (!this.options.progress.collected.includes(item.id))
        coin(ctx, item.x, item.y, this.time, index);
    });
    if (this.nearby) {
      const n = this.nearby;
      ctx.strokeStyle = "#fff3bc";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.ellipse(n.x, n.y + 6, 46, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const drawPlayer = () => {
      ctx.save();
      if (this.recoveryTime > 0 && Math.floor(this.time * 12) % 2 === 0)
        ctx.globalAlpha = 0.5;
      if (this.starTime > 0 || this.magnetTime > 0) {
        ctx.strokeStyle = this.starTime > 0 ? "#fff1a1" : "#b0e3ed";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
          this.player.x,
          this.player.y - this.jumpHeight - 18,
          31 + Math.sin(this.time * 8) * 3,
          35,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      mario(
        ctx,
        this.player.x,
        this.player.y,
        this.jumpHeight,
        moving,
        this.time,
        this.player.direction,
      );
      ctx.restore();
    };
    const drawGuardian = () => {
      if (this.guardian)
        bowser(
          ctx,
          this.guardian.x,
          this.guardian.y,
          this.time,
          this.guardian.direction,
          this.guardian.mode === "chase",
          this.guardian.stunTime > 0,
        );
    };
    // Feet determine draw order so Mario can walk in front of or behind Bowser.
    if (this.guardian && this.guardian.y > this.player.y) {
      drawPlayer();
      drawGuardian();
    } else {
      drawGuardian();
      drawPlayer();
    }
    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, 1 - particle.age / 1.4);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 5, 5);
    }
    ctx.globalAlpha = 1;
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, (1.3 - f.age) * 2);
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#544b3e";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // A soft edge vignette keeps the explorable scene framed like a diorama.
    const vignette = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.16,
      this.width / 2,
      this.height / 2,
      this.width * 0.65,
    );
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "#173e3b16");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private frame = (timestamp: number) => {
    const dt = this.lastTime
      ? Math.min((timestamp - this.lastTime) / 1000, 0.04)
      : 0;
    this.lastTime = timestamp;
    const moving =
      !this.paused && !document.hidden && !isGameOver(this.options.progress)
        ? this.update(dt)
        : false;
    this.draw(moving);
    this.animation = requestAnimationFrame(this.frame);
  };

  destroy() {
    cancelAnimationFrame(this.animation);
    this.observer.disconnect();
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
    window.removeEventListener("blur", this.clearInput);
    document.removeEventListener("visibilitychange", this.clearInput);
  }
}
