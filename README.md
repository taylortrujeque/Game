# Screenworld

A mobile-friendly, top-down Mario and movie-trivia adventure. This first playable prototype includes Peach’s Picture Palace, three explorable film worlds, collectible coins, jumping, nine trivia challenges, three Power Stars, and a palace finale.

## Develop

Use Node.js 22.12+ or 24 and npm. No accounts, API keys, database, or external art services are required.

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

Use the existing checkout at `/workspace/Game` in the managed cloud environment. Tasks already run in isolated environments; a Git worktree is unnecessary. If the home-directory npm cache is unavailable, use `npm ci --cache /tmp/screenworld-npm-cache`.

## Publish on GitHub Pages

In the repository's **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. The `Deploy Screenworld to GitHub Pages` workflow builds and deploys `dist` on pushes to `main`; it can also be run manually from the Actions tab.

Once deployed, the game is served at <https://taylortrujeque.github.io/Game/>. GitHub Pages needs the compiled website from `dist`, rather than the source `index.html` and TypeScript files. The Vite configuration uses relative asset URLs so the build works under `/Game/` and on other static hosts.

To check the production build in a strict static server at the same `/Game/` path:

```sh
npx playwright install chromium
npm run test:pages
```

In the managed cloud machine, use the existing browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:pages
```

## Play

| Action                                 | Keyboard                  | Touch                     |
| -------------------------------------- | ------------------------- | ------------------------- |
| Move                                   | WASD or arrow keys        | Drag the joystick         |
| Jump over low bushes                   | Space                     | Jump button               |
| Enter a portal, talk, or answer trivia | E when nearby             | A button when nearby      |
| Choose a world                         | World map or a world card | World map or a world card |
| Close a dialog                         | Escape or close button    | Close button              |

Find the golden question blocks in each world. The first challenge identifies the film; the next two test your knowledge. A correct answer gives five coins. Each wrong answer subtracts one coin from your score, including on retries; the score can drop below zero. Solve all three challenges to earn that world’s Power Star. Collect all three stars and visit the palace entrance for the finale.

Progress saves to this browser’s `localStorage`. The field guide shows your collection and offers a confirmed reset. Storage-disabled browsers can still play, but progress is limited to the current session. Sound effects are optional and off initially.

Mario starts with three lives, shown as hearts in the game HUD. Bowser patrols all three film worlds and chases Mario when he gets close. Jump over him or steer around him. A bump costs one life and one coin. With lives remaining, Mario returns to that world’s entrance with his coins, answered questions, and Power Stars retained, plus 2.4 seconds of recovery. Question blocks and the entrance are safe areas. Opening a dialog pauses the patrol, and the hub stays peaceful.

Losing the third life shows Game Over and stops play. **Start again** resets coins, answered trivia, Power Stars, and penalties, restores three lives, and returns Mario to Mushroom Meadow. Sound preferences are preserved. Lives and Game Over save across reloads; switching worlds does not refill them. Older saves keep their progress and receive three lives when first loaded. Wrong trivia answers still cost only one coin, not a life.

## Check

```sh
npm test
npm run build
```

The unit tests cover correct and incorrect answers, star completion, duplicate rewards, and save validation. The build includes strict TypeScript checking.

Browser tests exercise keyboard portal entry, all nine trivia challenges, retrying a wrong answer, all three stars, reload persistence, the palace finale, and native touch movement at a phone viewport:

```sh
npx playwright install chromium
npm run test:e2e
```

In the managed cloud machine, use the installed browser instead of downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

The browser runner starts Vite automatically unless a server is already using port 5173. Run `npm run preview -- --port 4173` to serve a production build.

## Project layout

- `src/content.ts` — film worlds, trivia, portal and coin locations.
- `src/state.ts` — validated saves, rewards, and completion rules.
- `src/art.ts` — original, procedurally drawn terrain, character sprites, and world illustrations.
- `src/game.ts` — animation, movement, camera, collision, collectibles, and interaction ranges.
- `src/guardian.ts` — Bowser patrols, pursuit, safe areas, and jump/contact rules.
- `src/main.ts` — game UI, touch controls, trivia dialogs, audio, and persistence.
- `src/style.css` — responsive game shell and dialogs.
- `tests/adventure.spec.ts` — browser playthroughs.

This is a 2D prototype inspired by the exploration and painting portals of Super Mario 64. It has no backend, multiplayer, or 3D platforming. All visuals are drawn locally with Canvas; the app makes no runtime requests for third-party fonts or artwork. The world and question data are separated from the engine so later levels and art can replace the prototype without rewriting the play loop.
