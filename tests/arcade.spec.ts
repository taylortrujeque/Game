import { expect, test, type Page } from "@playwright/test";

async function move(page: Page, key: string, ms: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(80);
}
async function jungle(page: Page) {
  await page.locator("#map-nav").click();
  await page.locator('#modal [data-world="jungle"]').click();
  await expect(page.locator("#scene-label")).toHaveText("JURASSIC JUNGLE");
  await page.waitForTimeout(200);
}
async function saved(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("screenworld-save-v1")!),
  );
}

test("Super Stars, dash-bonks, and jump-smashing magnet crates make exploration interactive", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await jungle(page);
  await move(page, "d", 275);
  await move(page, "w", 690);
  await expect(page.locator("#power-status")).toContainText("SUPER STAR");
  expect((await saved(page)).extras).toContain("jungle-star");
  await page.keyboard.down("a");
  await page.keyboard.press("Shift");
  await expect(page.locator("#dash-button")).toBeDisabled();
  await page.waitForTimeout(300);
  await page.keyboard.up("a");
  await expect
    .poll(async () => (await saved(page)).extras)
    .toContain("jungle-bonk");
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "3 of 3 lives remaining",
  );
  await move(page, "w", 450);
  await move(page, "a", 150);
  const before = Number(await page.locator("#coin-count").innerText());
  await page.keyboard.press("Space");
  await expect
    .poll(async () => (await saved(page)).extras)
    .toContain("jungle-crate-0");
  await expect
    .poll(async () => Number(await page.locator("#coin-count").innerText()))
    .toBeGreaterThan(before);
  await expect(page.locator("#dash-button")).toBeEnabled();
  expect(errors).toEqual([]);
});

test("hidden reels and healing mushrooms persist without being farmed by reloading", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "screenworld-save-v1",
      JSON.stringify({ version: 1, lives: 1 }),
    ),
  );
  await page.reload();
  await jungle(page);
  await move(page, "a", 550);
  await move(page, "s", 160);
  await expect(page.locator("#reel-status")).toContainText("1 / 3");
  await move(page, "w", 160);
  await move(page, "d", 2420);
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "2 of 3 lives remaining",
  );
  expect((await saved(page)).extras).toContain("jungle-mushroom");
  await page.reload();
  await expect(page.locator("#reel-status")).toContainText("1 / 9");
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "2 of 3 lives remaining",
  );
});

test("the finale unlocks after three stars and Bowser can be beaten with three timed jumps", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("#finale-card")).toBeDisabled();
  await page.evaluate(() =>
    localStorage.setItem(
      "screenworld-save-v1",
      JSON.stringify({
        version: 1,
        answered: [
          "jungle-1",
          "jungle-2",
          "jungle-3",
          "galaxy-1",
          "galaxy-2",
          "galaxy-3",
          "castle-1",
          "castle-2",
          "castle-3",
        ],
        lives: 1,
      }),
    ),
  );
  await page.reload();
  await page.locator("#finale-card").click();
  await expect(page.locator("#scene-label")).toHaveText("BOWSER’S PREMIERE");
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "3 of 3 lives remaining",
  );
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.keyboard.down("w");
  await page.keyboard.press("Shift");
  await page.clock.runFor(450);
  await page.keyboard.up("w");
  async function waitForPhase(phase: string) {
    for (let i = 0; i < 100; i++) {
      if (
        (await page.locator("#boss-hud").getAttribute("data-phase")) === phase
      )
        return;
      await page.clock.runFor(100);
    }
    throw new Error(`Boss never entered ${phase}`);
  }
  for (const health of [2, 1, 0]) {
    await waitForPhase("attack");
    await page.clock.runFor(130);
    await page.keyboard.press("Space");
    await waitForPhase("tired");
    await page.keyboard.down("w");
    await page.keyboard.press("Space");
    await page.clock.runFor(500);
    await page.keyboard.up("w");
    await expect(page.locator("#boss-health")).toHaveAttribute(
      "aria-valuenow",
      String(health),
    );
    if (health) {
      await page.keyboard.down("s");
      await page.clock.runFor(500);
      await page.keyboard.up("s");
    }
  }
  await page.clock.runFor(700);
  await expect(page.locator("#modal-title")).toHaveText(
    "You’re a screen legend!",
  );
  expect((await saved(page)).bossDefeated).toBe(true);
  await expect(page.locator("#coin-count")).toHaveText("95");
  await page.locator("#victory-new-run").click();
  await page.clock.runFor(300);
  await expect(page.locator("#scene-label")).toHaveText(
    "PEACH’S PICTURE PALACE",
  );
  await expect(page.locator("#coin-count")).toHaveText("00");
  expect(
    await page.evaluate(() => localStorage.getItem("screenworld-best-score")),
  ).toBe("95");
  expect((await saved(page)).bossDefeated).toBe(false);
  expect(errors).toEqual([]);
});
