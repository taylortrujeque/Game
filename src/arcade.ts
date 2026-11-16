import { isFilmWorld, type FilmWorldId, type WorldId } from "./content";

export type ExtraKind = "reel" | "star" | "mushroom" | "crate" | "bonk";
export interface Extra {
  id: string;
  kind: ExtraKind;
  x: number;
  y: number;
}
export const DASH_DURATION = 0.24;
export const DASH_COOLDOWN = 1.3;
export const STAR_DURATION = 8;
export const MAGNET_DURATION = 10;

export function extrasForWorld(world: WorldId): Extra[] {
  if (!isFilmWorld(world)) return [];
  return [
    { id: `${world}-reel-0`, kind: "reel", x: 230, y: 300 },
    { id: `${world}-reel-1`, kind: "reel", x: 1060, y: 450 },
    { id: `${world}-reel-2`, kind: "reel", x: 520, y: 755 },
    { id: `${world}-star`, kind: "star", x: 700, y: 570 },
    { id: `${world}-mushroom`, kind: "mushroom", x: 1050, y: 735 },
    { id: `${world}-crate-0`, kind: "crate", x: 500, y: 470 },
    { id: `${world}-crate-1`, kind: "crate", x: 790, y: 565 },
  ];
}
const filmIds: FilmWorldId[] = ["jungle", "galaxy", "castle"];
export const allExtras = filmIds.flatMap((world) => [
  ...extrasForWorld(world),
  { id: `${world}-bonk`, kind: "bonk" as const, x: 0, y: 0 },
]);
export const extraIds = new Set(allExtras.map((extra) => extra.id));

export interface Hazard {
  kind: "boulder" | "laser" | "spell";
  x: number;
  y: number;
  radius: number;
  active: boolean;
  warning: boolean;
}
export function hazardsForWorld(world: WorldId, time: number): Hazard[] {
  if (world === "jungle")
    return [
      {
        kind: "boulder",
        x: 610 + Math.sin(time * 0.8) * 100,
        y: 480,
        radius: 23,
        active: true,
        warning: false,
      },
    ];
  if (world === "galaxy") {
    const phase = time % 4.5;
    return [
      {
        kind: "laser",
        x: 640,
        y: 510,
        radius: 20,
        active: phase > 1.4 && phase < 2.8,
        warning: phase <= 1.4,
      },
    ];
  }
  if (world === "castle")
    return [
      {
        kind: "spell",
        x: 650 + Math.cos(time * 0.9) * 115,
        y: 530 + Math.sin(time * 0.9) * 65,
        radius: 18,
        active: true,
        warning: false,
      },
    ];
  return [];
}
export function touchesHazard(
  hazard: Hazard,
  player: { x: number; y: number },
): boolean {
  if (!hazard.active) return false;
  if (hazard.kind === "laser")
    return (
      Math.abs(player.x - hazard.x) < 120 && Math.abs(player.y - hazard.y) < 14
    );
  return (
    Math.hypot(player.x - hazard.x, player.y - hazard.y) < hazard.radius + 12
  );
}
