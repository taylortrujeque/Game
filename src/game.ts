import {
  coin,
  createTerrain,
  label,
  mario,
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
  portals,
  worldById,
  type Question,
  type WorldId,
} from "./content";
import { collectCoin, earnedStar, type Progress } from "./state";

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
interface GameOptions {
  canvas: HTMLCanvasElement;
  progress: Progress;
  onInteract: (interaction: Interaction) => void;
  onNearby: (interaction: Interaction | null) => void;
  onCollect: () => void;
  onJump: () => void;
}

export class Game {
  world: WorldId = "hub";
  paused = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private terrain = new Map<WorldId, HTMLCanvasElement>();
  private player = { x: 640, y: 706, direction: 1 };
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
    for (const id of ["hub", "jungle", "galaxy", "castle"] as WorldId[])
      this.terrain.set(id, createTerrain(id));
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
      this.width < 700
        ? 0.98
        : Math.max(0.64, Math.min(this.width / 1190, this.height / 790));
  }

  private keydown = (event: KeyboardEvent) => {
    if (this.paused || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
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
    this.paused = paused;
    this.clearInput();
  }

  enter(world: WorldId) {
    this.world = world;
    this.player = { x: 640, y: world === "hub" ? 706 : 720, direction: 1 };
    this.jumpHeight = 0;
    this.jumpTime = 0;
    this.particles = [];
    this.nearby = null;
    this.lastNearbyId = "";
    this.clearInput();
    this.updateNearby();
  }

  jump() {
    if (this.paused || this.jumpTime > 0) return;
    this.jumpTime = 0.001;
    this.options.onJump();
  }

  interact() {
    if (!this.paused && this.nearby) this.options.onInteract(this.nearby);
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

  private blocked(x: number, y: number): boolean {
    if (x < 112 || x > MAP_W - 112 || y < 215 || y > MAP_H - 58) return true;
    if (this.world === "hub" || this.world === "castle") {
      if (x > 474 && x < 806 && y > 218 && y < 328) return true;
    }
    if (this.world === "hub" && Math.hypot(x - 640, (y - 452) * 1.55) < 77)
      return true;
    const pondX = this.world === "hub" ? 1070 : 185;
    if (Math.hypot((x - pondX) / 1.2, y - 621) < 78) return true;
    if (this.jumpHeight < 14) {
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
    const speed = 218;
    const nx = this.player.x + (x / length) * speed * dt;
    const ny = this.player.y + (y / length) * speed * dt;
    if (!this.blocked(nx, this.player.y)) this.player.x = nx;
    if (!this.blocked(this.player.x, ny)) this.player.y = ny;
    if (Math.abs(x) > 0.05) this.player.direction = x < 0 ? -1 : 1;
    for (const item of coinsForWorld(this.world)) {
      if (
        !this.options.progress.collected.includes(item.id) &&
        Math.hypot(item.x - this.player.x, item.y - this.player.y) < 27
      ) {
        collectCoin(this.options.progress, item.id);
        this.options.onCollect();
        for (let i = 0; i < 6; i++)
          this.particles.push({
            x: item.x,
            y: item.y - 15,
            vx: (Math.random() - 0.5) * 80,
            vy: -40 - Math.random() * 60,
            age: 0,
            color: "#ffe4a0",
          });
      }
    }
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.age += dt;
    });
    this.particles = this.particles.filter((p) => p.age < 1.4);
    this.updateNearby();
    return Math.abs(x) > 0.1 || Math.abs(y) > 0.1;
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
      vw >= MAP_W
        ? MAP_W / 2
        : Math.max(vw / 2, Math.min(MAP_W - vw / 2, this.player.x));
    const cameraY =
      vh >= MAP_H
        ? MAP_H / 2
        : Math.max(vh / 2, Math.min(MAP_H - vh / 2, this.player.y - 60));
    ctx.save();
    ctx.translate(
      Math.round(this.width / 2 - cameraX * this.scale),
      Math.round(this.height / 2 - cameraY * this.scale),
    );
    ctx.scale(this.scale, this.scale);
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
    } else {
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
    mario(
      ctx,
      this.player.x,
      this.player.y,
      this.jumpHeight,
      moving,
      this.time,
      this.player.direction,
    );
    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, 1 - particle.age / 1.4);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 5, 5);
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
    const moving = !this.paused && !document.hidden ? this.update(dt) : false;
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
