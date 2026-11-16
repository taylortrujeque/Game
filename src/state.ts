import { allExtras, extraIds } from "./arcade";
import {
  allCoinIds,
  questionIds,
  worldById,
  type FilmWorldId,
} from "./content";

export const SAVE_KEY = "screenworld-save-v1";
export const MAX_LIVES = 3;
export interface Progress {
  version: 1;
  answered: string[];
  collected: string[];
  wrongAnswers: number;
  enemyHits: number;
  lives: number;
  sound: boolean;
  extras: string[];
  bonusCoins: number;
  streak: number;
  bestStreak: number;
  bossDefeated: boolean;
}
export const freshProgress = (): Progress => ({
  version: 1,
  answered: [],
  collected: [],
  wrongAnswers: 0,
  enemyHits: 0,
  lives: MAX_LIVES,
  sound: false,
  extras: [],
  bonusCoins: 0,
  streak: 0,
  bestStreak: 0,
  bossDefeated: false,
});

export function parseProgress(raw: string | null): Progress {
  if (!raw) return freshProgress();
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return freshProgress();
    const validIds = (input: unknown, valid: Set<string>): string[] =>
      Array.isArray(input)
        ? [
            ...new Set(
              input.filter(
                (id): id is string => typeof id === "string" && valid.has(id),
              ),
            ),
          ]
        : [];
    return {
      version: 1,
      answered: validIds(value.answered, questionIds),
      collected: validIds(value.collected, allCoinIds),
      wrongAnswers:
        Number.isSafeInteger(value.wrongAnswers) && value.wrongAnswers >= 0
          ? value.wrongAnswers
          : 0,
      enemyHits:
        Number.isSafeInteger(value.enemyHits) && value.enemyHits >= 0
          ? value.enemyHits
          : 0,
      // Older saves receive three lives without losing their existing progress.
      lives:
        Number.isInteger(value.lives) &&
        value.lives >= 0 &&
        value.lives <= MAX_LIVES
          ? value.lives
          : MAX_LIVES,
      sound: value.sound === true,
      extras: validIds(value.extras, extraIds),
      bonusCoins:
        Number.isSafeInteger(value.bonusCoins) && value.bonusCoins >= 0
          ? Math.min(value.bonusCoins, 1000000)
          : 0,
      streak:
        Number.isInteger(value.streak) && value.streak >= 0
          ? Math.min(value.streak, 9)
          : 0,
      bestStreak:
        Number.isInteger(value.bestStreak) && value.bestStreak >= 0
          ? Math.min(value.bestStreak, 9)
          : 0,
      bossDefeated: value.bossDefeated === true,
    };
  } catch {
    return freshProgress();
  }
}

export function isGameOver(progress: Progress): boolean {
  return progress.lives === 0;
}

export function earnedStar(progress: Progress, world: FilmWorldId): boolean {
  return worldById(world).questions.every((question) =>
    progress.answered.includes(question.id),
  );
}
export function starCount(progress: Progress): number {
  return (["jungle", "galaxy", "castle"] as FilmWorldId[]).filter((id) =>
    earnedStar(progress, id),
  ).length;
}
export function coinCount(progress: Progress): number {
  return (
    progress.collected.length +
    progress.answered.length * 5 -
    progress.wrongAnswers -
    progress.enemyHits +
    progress.bonusCoins
  );
}
export function answerQuestion(
  progress: Progress,
  id: string,
  option: number | null,
  remainingMs = 0,
): boolean {
  if (isGameOver(progress)) return false;
  const question = (["jungle", "galaxy", "castle"] as FilmWorldId[])
    .flatMap((world) => worldById(world).questions)
    .find((question) => question.id === id);
  if (
    !question ||
    (option !== null &&
      (!Number.isInteger(option) ||
        option < 0 ||
        option >= question.options.length))
  )
    return false;
  if (progress.answered.includes(id)) return question.answer === option;
  // A null selection is a timed-out question, with the same one-point penalty.
  if (question.answer !== option) {
    progress.wrongAnswers += 1;
    progress.streak = 0;
    return false;
  }
  progress.answered.push(id);
  progress.streak++;
  progress.bestStreak = Math.max(progress.bestStreak, progress.streak);
  progress.bonusCoins +=
    Math.min(progress.streak - 1, 4) + (remainingMs >= 3000 ? 2 : 0);
  return true;
}
export function collectCoin(progress: Progress, id: string): boolean {
  if (
    isGameOver(progress) ||
    !allCoinIds.has(id) ||
    progress.collected.includes(id)
  )
    return false;
  progress.collected.push(id);
  return true;
}

export function takeEnemyHit(progress: Progress): boolean {
  if (isGameOver(progress)) return false;
  progress.enemyHits += 1;
  progress.lives -= 1;
  progress.streak = 0;
  return true;
}

export function reelCount(progress: Progress, world?: FilmWorldId): number {
  return progress.extras.filter(
    (id) => id.includes("-reel-") && (!world || id.startsWith(world + "-")),
  ).length;
}
export function claimExtra(
  progress: Progress,
  id: string,
): {
  kind: string;
  coins: number;
  healed: boolean;
  setComplete: boolean;
} | null {
  if (isGameOver(progress) || progress.extras.includes(id)) return null;
  const extra = allExtras.find((item) => item.id === id);
  if (!extra) return null;
  progress.extras.push(id);
  let coins =
    extra.kind === "reel"
      ? 2
      : extra.kind === "crate" || extra.kind === "bonk"
        ? 3
        : 0;
  let healed = false;
  let setComplete = false;
  if (extra.kind === "mushroom") {
    if (progress.lives < MAX_LIVES) {
      progress.lives++;
      healed = true;
    } else coins = 5;
  }
  if (extra.kind === "reel") {
    const world = id.split("-")[0] as FilmWorldId;
    setComplete = reelCount(progress, world) === 3;
    if (setComplete) {
      coins += 10;
      if (progress.lives < MAX_LIVES) {
        progress.lives++;
        healed = true;
      }
    }
  }
  progress.bonusCoins += coins;
  return { kind: extra.kind, coins, healed, setComplete };
}
export function winFinale(progress: Progress): boolean {
  if (
    isGameOver(progress) ||
    starCount(progress) !== 3 ||
    progress.bossDefeated
  )
    return false;
  progress.bossDefeated = true;
  progress.bonusCoins += 50;
  return true;
}
