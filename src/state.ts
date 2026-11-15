import {
  allCoinIds,
  questionIds,
  worldById,
  type FilmWorldId,
} from "./content";

export const SAVE_KEY = "screenworld-save-v1";
export interface Progress {
  version: 1;
  answered: string[];
  collected: string[];
  sound: boolean;
}
export const freshProgress = (): Progress => ({
  version: 1,
  answered: [],
  collected: [],
  sound: false,
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
      sound: value.sound === true,
    };
  } catch {
    return freshProgress();
  }
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
  return progress.collected.length + progress.answered.length * 5;
}
export function answerQuestion(
  progress: Progress,
  id: string,
  option: number,
): boolean {
  const question = (["jungle", "galaxy", "castle"] as FilmWorldId[])
    .flatMap((world) => worldById(world).questions)
    .find((question) => question.id === id);
  if (!question || question.answer !== option) return false;
  if (!progress.answered.includes(id)) progress.answered.push(id);
  return true;
}
export function collectCoin(progress: Progress, id: string): boolean {
  if (!allCoinIds.has(id) || progress.collected.includes(id)) return false;
  progress.collected.push(id);
  return true;
}
