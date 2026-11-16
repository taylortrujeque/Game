import { describe, expect, it } from "vitest";
import { worlds } from "./content";
import {
  answerQuestion,
  claimExtra,
  coinCount,
  freshProgress,
  parseProgress,
  reelCount,
  takeEnemyHit,
  winFinale,
} from "./state";
import { hazardsForWorld, touchesHazard } from "./arcade";
import { createBoss, stompBoss, updateBoss } from "./boss";

describe("arcade rewards", () => {
  it("rewards quick answers and streaks once, and breaks the streak on a miss", () => {
    const p = freshProgress();
    answerQuestion(p, "jungle-1", 2, 4000);
    expect(coinCount(p)).toBe(7);
    answerQuestion(p, "jungle-2", 1, 1000);
    expect(coinCount(p)).toBe(13);
    expect(p.bestStreak).toBe(2);
    answerQuestion(p, "jungle-2", 1, 4000);
    expect(coinCount(p)).toBe(13);
    answerQuestion(p, "jungle-3", null);
    expect(p.streak).toBe(0);
    expect(p.bestStreak).toBe(2);
    answerQuestion(p, "jungle-3", 0, 4000);
    expect(coinCount(p)).toBe(19);
  });
  it("rewards a full reel set with a heart and rejects duplicate or invented pickups", () => {
    const p = freshProgress();
    takeEnemyHit(p);
    for (let i = 0; i < 3; i++)
      expect(claimExtra(p, `jungle-reel-${i}`)).not.toBeNull();
    expect(reelCount(p, "jungle")).toBe(3);
    expect(p.lives).toBe(3);
    expect(p.bonusCoins).toBe(16);
    expect(claimExtra(p, "jungle-reel-2")).toBeNull();
    expect(claimExtra(p, "invented-pickup")).toBeNull();
    expect(p.bonusCoins).toBe(16);
    expect(parseProgress(JSON.stringify(p)).extras).toEqual(p.extras);
  });
  it("caps healing at three hearts and only awards the boss crown once", () => {
    const p = freshProgress();
    expect(claimExtra(p, "galaxy-mushroom")?.coins).toBe(5);
    expect(p.lives).toBe(3);
    expect(winFinale(p)).toBe(false);
    for (const world of worlds)
      for (const q of world.questions) answerQuestion(p, q.id, q.answer);
    const before = coinCount(p);
    expect(winFinale(p)).toBe(true);
    expect(coinCount(p)).toBe(before + 50);
    expect(winFinale(p)).toBe(false);
    expect(coinCount(p)).toBe(before + 50);
    expect(parseProgress(JSON.stringify(p)).bossDefeated).toBe(true);
  });
  it("migrates old adventures and filters corrupt reward fields", () => {
    const p = parseProgress(
      JSON.stringify({
        version: 1,
        answered: ["jungle-1"],
        lives: 2,
        extras: ["jungle-star", "fake", "jungle-star"],
        bonusCoins: -8,
        streak: 900,
        bestStreak: -2,
      }),
    );
    expect(p.lives).toBe(2);
    expect(p.answered).toEqual(["jungle-1"]);
    expect(p.extras).toEqual(["jungle-star"]);
    expect(p.bonusCoins).toBe(0);
    expect(p.streak).toBeLessThanOrEqual(9);
  });
});

describe("film hazards and final showdown", () => {
  it("telegraphs lasers before they become dangerous", () => {
    const warning = hazardsForWorld("galaxy", 0.5)[0];
    const firing = hazardsForWorld("galaxy", 2)[0];
    expect(warning.warning).toBe(true);
    expect(touchesHazard(warning, { x: 640, y: 510 })).toBe(false);
    expect(touchesHazard(firing, { x: 640, y: 510 })).toBe(true);
    expect(touchesHazard(firing, { x: 900, y: 510 })).toBe(false);
    expect(hazardsForWorld("hub", 2)).toEqual([]);
  });
  it("requires three separate vulnerable jump attacks and stops fire after victory", () => {
    const boss = createBoss(),
      player = { x: 640, y: 440 };
    expect(stompBoss(boss, player, 53)).toBe(false);
    for (const health of [2, 1, 0]) {
      for (let i = 0; i < 100 && boss.phase !== "tired"; i++)
        updateBoss(boss, player, 0.1);
      expect(boss.phase).toBe("tired");
      expect(stompBoss(boss, player, 0)).toBe(false);
      expect(stompBoss(boss, { x: 800, y: 700 }, 53)).toBe(false);
      expect(stompBoss(boss, player, 53)).toBe(true);
      expect(boss.health).toBe(health);
      expect(stompBoss(boss, player, 53)).toBe(false);
    }
    expect(boss.phase).toBe("defeated");
    updateBoss(boss, player, 20);
    expect(boss.fireballs).toEqual([]);
  });
});
