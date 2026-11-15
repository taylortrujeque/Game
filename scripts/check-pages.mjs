// Serve a real /Game/ directory without Vite's development or SPA fallbacks.
// Absolute /assets URLs or uncompiled /src/main.ts references must fail here.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { chromium } from "@playwright/test";

const root = await mkdtemp(join(tmpdir(), "screenworld-pages-"));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(
      root,
      `.${pathname}${pathname.endsWith("/") ? "index.html" : ""}`,
    );
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const extension = file.slice(file.lastIndexOf("."));
    const contents = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extension] || "application/octet-stream",
    });
    response.end(contents);
  } catch {
    // No history fallback: a missing asset on GitHub Pages is a real 404.
    if (!response.headersSent) response.writeHead(404);
    response.end();
  }
});

let browser;
try {
  await cp(resolve("dist"), join(root, "Game"), { recursive: true });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => errors.push(request.url()));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    const response = await page.goto(`http://127.0.0.1:${port}/Game/`, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    await page.locator("#game").waitFor({ state: "visible" });
    assert.equal(await page.locator("#world-cards .world-card").count(), 3);
    const favicon = await page.locator('link[rel="icon"]').getAttribute("href");
    const iconResponse = await page.request.get(
      new URL(favicon, page.url()).toString(),
    );
    assert.equal(iconResponse.status(), 200);
    await page.locator("#map-nav").click();
    await page.locator('#modal [data-world="jungle"]').click();
    await page.waitForFunction(
      () => document.querySelector("#scene-label").textContent === "JURASSIC JUNGLE",
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS /Game/ ${viewport.width}×${viewport.height}: game, world entry, JavaScript, CSS, and favicon loaded`,
    );
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
}
