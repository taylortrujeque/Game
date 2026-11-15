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
} from "./state";

describe("adventure progress", () => {
  it("awards one star only after all three correct challenges in a world", () => {
    const progress = freshProgress();
    const questions = worlds[0].questions;
    expect(
      answerQuestion(progress, questions[0].id, (questions[0].answer + 1) % 4),
    ).toBe(false);
    expect(progress.answered).toEqual([]);
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
  it("does not duplicate collected coins or accept invented rewards", () => {
    const progress = freshProgress();
    expect(collectCoin(progress, "hub-coin-0")).toBe(true);
    expect(collectCoin(progress, "hub-coin-0")).toBe(false);
    expect(collectCoin(progress, "invented-coin")).toBe(false);
    expect(coinCount(progress)).toBe(1);
    expect(answerQuestion(progress, "invented-question", 0)).toBe(false);
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
      sound: true,
    });
  });
  it("completes the adventure when every film world is solved", () => {
    const progress = freshProgress();
    for (const world of worlds)
      for (const question of world.questions)
        answerQuestion(progress, question.id, question.answer);
    expect(starCount(progress)).toBe(3);
    expect(coinCount(progress)).toBe(45);
  });
});
