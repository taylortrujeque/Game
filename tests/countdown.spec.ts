import { expect, test, type Page } from "@playwright/test";

async function openFirstQuestion(page: Page) {
  await page.locator("#map-nav").click();
  await page.locator('#modal [data-world="jungle"]').click();
  await expect(page.locator("#scene-label")).toHaveText("JURASSIC JUNGLE");
  await page.waitForTimeout(200);
  for (const [key, duration] of [
    ["a", 1280],
    ["w", 1500],
  ] as const) {
    await page.keyboard.down(key);
    await page.waitForTimeout(duration);
    await page.keyboard.up(key);
    await page.waitForTimeout(80);
  }
  await expect(page.locator("#interaction-label")).toHaveText(
    "Name that movie",
  );
  await page.keyboard.press("e");
  await expect(page.locator("#quiz-seconds")).toHaveText("5s");
}

test("question timeouts deduct once, retries get five seconds, and answering stops the clock", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  await openFirstQuestion(page);
  const before = Number(await page.locator("#coin-count").innerText());
  await page.clock.fastForward(5100);
  await expect(page.locator("#quiz-seconds")).toHaveText("0s");
  await expect(page.locator(".wrong-feedback")).toContainText("Time’s up");
  await expect(page.locator("#coin-count")).toHaveText(
    String(before - 1).padStart(2, "0"),
  );
  for (const button of await page.locator("[data-answer]").all())
    await expect(button).toBeDisabled();
  await expect(page.locator("#lives-hud")).toHaveAttribute(
    "aria-label",
    "3 of 3 lives remaining",
  );
  await page.clock.fastForward(10_000);
  await expect(page.locator("#coin-count")).toHaveText(
    String(before - 1).padStart(2, "0"),
  );
  await page.locator(".feedback-retry").click();
  await expect(page.locator("#quiz-seconds")).toHaveText("5s");
  await page.clock.fastForward(3000);
  await expect(page.locator("#quiz-seconds")).toHaveText("2s");
  await page.locator('[data-answer="2"]').click();
  await expect(page.locator(".correct-feedback")).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(page.locator(".correct-feedback")).toBeVisible();
  await expect(page.locator("#coin-count")).toHaveText(
    String(before + 4).padStart(2, "0"),
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("screenworld-save-v1")!).wrongAnswers,
    ),
  ).toBe(1);
  await page.locator(".feedback-continue").click();
  await page.locator("#guide-nav").click();
  await page.clock.fastForward(6000);
  await expect(page.locator("#modal-title")).toHaveText("The field guide.");
  await expect(page.locator("#coin-count")).toHaveText(
    String(before + 4).padStart(2, "0"),
  );
  expect(errors).toEqual([]);
});

test("closing a question cancels its countdown without changing the next screen or score", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  await openFirstQuestion(page);
  const before = await page.locator("#coin-count").innerText();
  await page.clock.fastForward(1000);
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).not.toBeVisible();
  await page.locator("#map-nav").click();
  await page.clock.fastForward(6000);
  await expect(page.locator("#modal-title")).toHaveText("Where to next?");
  await expect(page.locator("#coin-count")).toHaveText(before);
  expect(errors).toEqual([]);
});
