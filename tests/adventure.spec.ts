import { expect, test, type Page } from "@playwright/test";

async function move(page: Page, key: string, duration: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(80);
}

async function interact(page: Page, title: string) {
  await expect(page.locator("#interaction-label")).toHaveText(title);
  await page.keyboard.press("e");
  await expect(page.locator("#modal")).toBeVisible();
}

async function answer(page: Page, option: number) {
  await page.locator(`[data-answer="${option}"]`).click();
  await expect(page.locator(".correct-feedback")).toBeVisible();
  await page.locator(".feedback-continue").click();
  await expect(page.locator("#modal")).not.toBeVisible();
  // The browser dispatches the native dialog's close event on the next frame.
  await page.waitForTimeout(150);
}

test("walks through a hub portal with keyboard controls", async ({ page }) => {
  await page.goto("/");
  await page.locator("#help-button").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#modal-title")).toHaveText("Ready, player one?");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  await move(page, "a", 1550);
  await expect(page.locator("#interact-button")).toBeEnabled();
  await expect(page.locator("#interaction-label")).toHaveText(
    "Enter Enchanted Castle",
  );
  await page.keyboard.press("e");
  await expect(page.locator("#scene-label")).toHaveText("ENCHANTED CASTLE");
  await page.locator("#back-hub").click();
  await expect(page.locator("#scene-label")).toHaveText(
    "PEACH’S PICTURE PALACE",
  );
});

test("earns all stars, retries trivia, saves progress, and reaches the finale", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const routes = [
    {
      id: "jungle",
      title: "JURASSIC JUNGLE",
      answers: [2, 1, 0],
      second: "Behind the camera",
      third: "Clever girl",
    },
    {
      id: "galaxy",
      title: "GALACTIC OUTPOST",
      answers: [1, 3, 2],
      second: "A long way from home",
      third: "Trust your instincts",
    },
    {
      id: "castle",
      title: "ENCHANTED CASTLE",
      answers: [2, 0, 3],
      second: "The Sorting Hat",
      third: "Who’s a good dog?",
    },
  ];
  for (const [index, route] of routes.entries()) {
    await page.locator("#map-nav").click();
    await page.locator(`#modal [data-world="${route.id}"]`).click();
    await expect(page.locator("#scene-label")).toHaveText(route.title);
    await page.waitForTimeout(200);
    await move(page, "a", 1280);
    await move(page, "w", 1500);
    await interact(page, "Name that movie");
    if (index === 0) {
      const scoreBefore = Number(await page.locator("#coin-count").innerText());
      await page.locator('[data-answer="0"]').click();
      await expect(page.locator(".wrong-feedback")).toContainText("Not quite");
      await expect(page.locator(".wrong-feedback")).toContainText("-1 coin");
      await expect(page.locator("#coin-count")).toHaveText(
        String(scoreBefore - 1).padStart(2, "0"),
      );
      await expect(page.locator("#lives-hud")).toHaveAttribute(
        "aria-label",
        "3 of 3 lives remaining",
      );
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("screenworld-save-v1")!)
              .wrongAnswers,
        ),
      ).toBe(1);
      await page.locator(".feedback-retry").click();
      await expect(page.locator('[data-answer="2"]')).toBeEnabled();
    }
    await answer(page, route.answers[0]);
    await move(page, "d", 2420);
    await interact(page, route.second);
    await answer(page, route.answers[1]);
    await move(page, "s", 1160);
    await interact(page, route.third);
    await answer(page, route.answers[2]);
    await expect(page.locator("#star-count")).toHaveText(String(index + 1));
  }
  const savedScore = await page.locator("#coin-count").innerText();
  await page.reload();
  await expect(page.locator("#coin-count")).toHaveText(savedScore);
  await expect(page.locator("#star-count")).toHaveText("3");
  await expect(page.locator("#quest-title")).toHaveText(
    "Your grand finale awaits",
  );
  await move(page, "d", 420);
  await move(page, "w", 1270);
  await move(page, "a", 420);
  await move(page, "w", 420);
  await interact(page, "Visit the Picture Palace");
  await expect(page.locator("#modal-title")).toHaveText(
    "Your final scene awaits!",
  );
  expect(errors).toEqual([]);
});

test("phone layout supports touch movement, a portal, and an accessible field guide", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5173/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const box = (await page.locator("#joystick").boundingBox())!;
  const session = await context.newCDPSession(page);
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x - 29, y }],
  });
  await page.waitForTimeout(1550);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("#interact-button")).toHaveAttribute(
    "aria-label",
    "Enter Enchanted Castle",
  );
  await page.locator("#interact-button").tap();
  await expect(page.locator("#scene-label")).toHaveText("ENCHANTED CASTLE");
  await expect(page.locator("#enemy-warning")).toBeVisible();
  await page.locator("#guide-nav").tap();
  await expect(page.locator("#modal-title")).toHaveText("The field guide.");
  await page.getByRole("button", { name: "Close dialog" }).tap();
  await expect(page.locator("#modal")).not.toBeVisible();
  // A saved game-over state must also be usable on a phone.
  await page.evaluate(() => {
    const key = "screenworld-save-v1";
    const progress = JSON.parse(localStorage.getItem(key) || '{"version":1}');
    progress.lives = 0;
    localStorage.setItem(key, JSON.stringify(progress));
  });
  await page.reload();
  await expect(page.locator("#modal-title")).toHaveText("Game Over");
  await page.getByRole("button", { name: "Start again" }).tap();
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "3 of 3 lives remaining",
  );
  await expect(page.locator("#scene-label")).toHaveText(
    "PEACH’S PICTURE PALACE",
  );
  expect(errors).toEqual([]);
  await context.close();
});

test("Bowser pursues Mario, costs one point per bump, and pauses during trivia and menus", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#enemy-warning")).not.toBeVisible();
  await page.locator("#map-nav").click();
  await page.locator('#modal [data-world="jungle"]').click();
  await expect(page.locator("#scene-label")).toHaveText("JURASSIC JUNGLE");
  await expect(page.locator("#enemy-warning")).toBeVisible();
  await page.waitForTimeout(200);
  const scoreBefore = Number(await page.locator("#coin-count").innerText());
  await move(page, "w", 600);
  await expect(page.locator("#toast")).toContainText("Bowser bump!", {
    timeout: 8000,
  });
  await expect(page.locator("#coin-count")).toHaveText(
    String(scoreBefore - 1).padStart(2, "0"),
  );
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "2 of 3 lives remaining",
  );
  await page.waitForTimeout(600);
  await expect(page.locator("#coin-count")).toHaveText(
    String(scoreBefore - 1).padStart(2, "0"),
  );
  await page.locator("#guide-nav").click();
  await expect(page.locator("#modal-title")).toHaveText("The field guide.");
  await page.waitForTimeout(2600);
  await expect(page.locator("#coin-count")).toHaveText(
    String(scoreBefore - 1).padStart(2, "0"),
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("screenworld-save-v1")!).enemyHits,
    ),
  ).toBe(1);
  await page.reload();
  await expect(page.locator("#coin-count")).toHaveText(
    String(scoreBefore - 1).padStart(2, "0"),
  );
  await expect(page.locator("#enemy-warning")).not.toBeVisible();
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "2 of 3 lives remaining",
  );
});

test("three Bowser hits force game over, survive reload, and require a fresh start", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "screenworld-save-v1",
      JSON.stringify({
        version: 1,
        answered: ["jungle-1", "jungle-2", "jungle-3"],
        collected: ["hub-coin-0"],
        wrongAnswers: 1,
        enemyHits: 0,
        lives: 3,
        sound: true,
      }),
    ),
  );
  await page.reload();
  await expect(page.locator("#star-count")).toHaveText("1");
  await page.locator("#map-nav").click();
  await page.locator('#modal [data-world="jungle"]').click();
  await expect(page.locator("#scene-label")).toHaveText("JURASSIC JUNGLE");
  await page.waitForTimeout(200);
  for (const lives of [2, 1, 0]) {
    if (lives < 2) await page.waitForTimeout(2500);
    await move(page, "w", 600);
    await expect(page.locator("#lives-hud")).toHaveAttribute(
      "aria-label",
      `${lives} of 3 lives remaining`,
    );
    if (lives > 0) {
      await expect(page.locator("#star-count")).toHaveText("1");
      await expect(page.locator("#interaction-label")).toHaveText(
        "Return to the hub",
      );
      await expect(page.locator("#modal")).not.toBeVisible();
    }
  }
  await expect(page.locator("#modal-title")).toHaveText("Game Over");
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(page.locator("#modal")).toBeVisible();
  const finalScore = await page.locator("#coin-count").innerText();
  await page.waitForTimeout(700);
  await expect(page.locator("#coin-count")).toHaveText(finalScore);
  await page.reload();
  await expect(page.locator("#modal-title")).toHaveText("Game Over");
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "0 of 3 lives remaining",
  );
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page.locator("#modal")).not.toBeVisible();
  await expect(page.locator("#scene-label")).toHaveText(
    "PEACH’S PICTURE PALACE",
  );
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "3 of 3 lives remaining",
  );
  await expect(page.locator("#coin-count")).toHaveText("00");
  await expect(page.locator("#star-count")).toHaveText("0");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("screenworld-save-v1")!),
    ),
  ).toEqual({
    version: 1,
    answered: [],
    collected: [],
    wrongAnswers: 0,
    enemyHits: 0,
    lives: 3,
    sound: true,
    extras: [],
    bonusCoins: 0,
    streak: 0,
    bestStreak: 0,
    bossDefeated: false,
  });
  await page.locator("#map-nav").click();
  await page.locator('#modal [data-world="galaxy"]').click();
  await expect(page.locator("#scene-label")).toHaveText("GALACTIC OUTPOST");
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "3 of 3 lives remaining",
  );
});
