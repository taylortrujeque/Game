import { describe, expect, it } from "vitest";
import { worlds } from "./content";
import {
  answerQuestion,
  coinCount,
  collectCoin,
  earnedStar,
  freshProgress,
  parseProgress,
  starCount,
  takeEnemyHit,
  isGameOver,
  MAX_LIVES,
} from "./state";

describe("adventure progress", () => {
  it("awards one star only after all three correct challenges in a world", () => {
    const progress = freshProgress();
    const questions = worlds[0].questions;
    for (const question of questions.slice(0, 2))
      answerQuestion(progress, question.id, question.answer);
    expect(earnedStar(progress, "jungle")).toBe(false);
    answerQuestion(progress, questions[2].id, questions[2].answer);
    expect(earnedStar(progress, "jungle")).toBe(true);
    expect(starCount(progress)).toBe(1);
    expect(coinCount(progress)).toBe(15);
    answerQuestion(progress, questions[2].id, questions[2].answer);
    expect(coinCount(progress)).toBe(15);
  });
  it("subtracts one point for each wrong answer, including retries and at zero", () => {
    const progress = freshProgress();
    const question = worlds[0].questions[0];
    const wrongAnswer = (question.answer + 1) % question.options.length;
    collectCoin(progress, "hub-coin-0");
    collectCoin(progress, "hub-coin-1");
    for (const expected of [1, 0, -1]) {
      expect(answerQuestion(progress, question.id, wrongAnswer)).toBe(false);
      expect(coinCount(progress)).toBe(expected);
      expect(progress.answered).toEqual([]);
      expect(starCount(progress)).toBe(0);
    }
    expect(progress.wrongAnswers).toBe(3);
    const restored = parseProgress(JSON.stringify(progress));
    expect(coinCount(restored)).toBe(-1);
    expect(restored.wrongAnswers).toBe(3);
    expect(answerQuestion(restored, question.id, question.answer)).toBe(true);
    expect(coinCount(restored)).toBe(4);
    // A stale submission for a completed challenge must not change its score.
    answerQuestion(restored, question.id, question.answer);
    answerQuestion(restored, question.id, wrongAnswer);
    expect(coinCount(restored)).toBe(4);
  });
  it("does not duplicate collected coins or accept invented rewards", () => {
    const progress = freshProgress();
    expect(collectCoin(progress, "hub-coin-0")).toBe(true);
    expect(collectCoin(progress, "hub-coin-0")).toBe(false);
    expect(collectCoin(progress, "invented-coin")).toBe(false);
    expect(coinCount(progress)).toBe(1);
    expect(answerQuestion(progress, "invented-question", 0)).toBe(false);
    for (const option of [-1, 4, 1.5, NaN]) {
      expect(answerQuestion(progress, "jungle-1", option)).toBe(false);
    }
    expect(coinCount(progress)).toBe(1);
    expect(progress.wrongAnswers).toBe(0);
  });
  it("restores valid saved progress and sanitizes malformed saves", () => {
    expect(parseProgress("{broken")).toEqual(freshProgress());
    expect(parseProgress("null")).toEqual(freshProgress());
    expect(parseProgress(JSON.stringify({ version: 2 }))).toEqual(
      freshProgress(),
    );
    expect(
      parseProgress(
        JSON.stringify({
          version: 1,
          answered: ["jungle-1", "fake", "jungle-1", 4],
          collected: ["hub-coin-0", "hub-coin-0", "fake"],
          sound: true,
        }),
      ),
    ).toEqual({
      version: 1,
      answered: ["jungle-1"],
      collected: ["hub-coin-0"],
      wrongAnswers: 0,
      enemyHits: 0,
      lives: 3,
      sound: true,
    });
    for (const wrongAnswers of [
      -1,
      1.5,
      "2",
      null,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(
        parseProgress(JSON.stringify({ version: 1, wrongAnswers }))
          .wrongAnswers,
      ).toBe(0);
    }
  });
  it("completes the adventure when every film world is solved", () => {
    const progress = freshProgress();
    for (const world of worlds)
      for (const question of world.questions)
        answerQuestion(progress, question.id, question.answer);
    expect(starCount(progress)).toBe(3);
    expect(coinCount(progress)).toBe(45);
  });
  it("saves enemy penalties separately from wrong answers and resets them with a new adventure", () => {
    const progress = freshProgress();
    collectCoin(progress, "hub-coin-0");
    takeEnemyHit(progress);
    expect(coinCount(progress)).toBe(0);
    expect(progress.wrongAnswers).toBe(0);
    expect(parseProgress(JSON.stringify(progress)).enemyHits).toBe(1);
    expect(parseProgress(JSON.stringify({ version: 1 })).enemyHits).toBe(0);
    expect(
      parseProgress(JSON.stringify({ version: 1, enemyHits: -4 })).enemyHits,
    ).toBe(0);
    expect(freshProgress().enemyHits).toBe(0);
  });
  it("starts with three lives and ends the adventure after exactly three hits", () => {
    const progress = freshProgress();
    expect(progress.lives).toBe(MAX_LIVES);
    for (const lives of [2, 1, 0]) {
      expect(takeEnemyHit(progress)).toBe(true);
      expect(progress.lives).toBe(lives);
      expect(isGameOver(progress)).toBe(lives === 0);
    }
    expect(progress.enemyHits).toBe(3);
    expect(takeEnemyHit(progress)).toBe(false);
    expect(progress.enemyHits).toBe(3);
    expect(progress.lives).toBe(0);
    expect(collectCoin(progress, "hub-coin-0")).toBe(false);
    expect(answerQuestion(progress, "jungle-1", 2)).toBe(false);
    expect(coinCount(progress)).toBe(-3);
  });
  it("persists remaining lives and game over, while migrating older saves with three lives", () => {
    const progress = freshProgress();
    takeEnemyHit(progress);
    expect(parseProgress(JSON.stringify(progress)).lives).toBe(2);
    takeEnemyHit(progress);
    takeEnemyHit(progress);
    expect(isGameOver(parseProgress(JSON.stringify(progress)))).toBe(true);
    const legacy = parseProgress(
      JSON.stringify({ version: 1, answered: ["jungle-1"], enemyHits: 9 }),
    );
    expect(legacy.lives).toBe(3);
    expect(legacy.answered).toEqual(["jungle-1"]);
    for (const lives of [-1, 4, 1.5, "2", null]) {
      expect(parseProgress(JSON.stringify({ version: 1, lives })).lives).toBe(
        3,
      );
    }
    expect(freshProgress().lives).toBe(3);
    expect(isGameOver(freshProgress())).toBe(false);
  });
});
