# Screenworld

A mobile-friendly, top-down Mario and movie-trivia adventure. Explore three film worlds, dash through hazards, smash crates, collect power-ups and hidden reels, build trivia streaks, and unlock a playable Bowser finale. Personal records and end-of-run ranks give each replay a new goal.

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
| Dash, evade danger, and smash crates   | Shift                     | Lightning button          |
| Enter a portal, talk, or answer trivia | E when nearby             | A button when nearby      |
| Choose a world                         | World map or a world card | World map or a world card |
| Close a dialog                         | Escape or close button    | Close button              |

Find the golden question blocks in each world. The first challenge identifies the film; the next two test your knowledge. A correct answer gives five coins. Answer within two seconds for two extra coins. Consecutive correct answers build a streak that adds up to four more coins per answer. Wrong answers, timeouts, and damage break the streak; wrong answers and timeouts subtract one coin. Solve all three challenges to earn a Power Star. Collect all three stars to unlock **The Final Cut**, a real-time Bowser showdown.

Each question attempt has a visible five-second countdown. It stops when you answer. Running out of time costs one coin, leaves the question unsolved, and lets you retry with a fresh five seconds. Wrong answers and timeouts do not cost a life. Reading feedback does not use more time or deduct more points. Closing a question cancels its countdown. The deadline uses elapsed time, so a throttled or background tab cannot submit an answer after the limit.

Progress saves to this browser’s `localStorage`. The field guide shows your collection and offers a confirmed reset. Storage-disabled browsers can still play, but progress is limited to the current session. Sound effects are optional and off initially.

Mario starts with three lives, shown as hearts. Bowser patrols the film worlds, which also have rolling boulders, telegraphed laser beams, or sweeping magic. Jump or dash past danger. Jumping onto Bowser, dashing into him, or touching him with a Super Star stuns him; the first bonk in each world earns three coins. Contact without protection costs one life and one coin and returns Mario to the entrance. Question blocks and entrances are safe from Bowser, and the hub stays peaceful.

| Discovery        | Reward                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Super Star       | Eight seconds of invincibility; run into Bowser to stun him.                             |
| Wooden crate     | Jump or dash into it for three coins and a ten-second coin magnet.                       |
| Mushroom         | Restores one heart, or gives five coins if hearts are full.                              |
| Hidden film reel | Two coins; find all three in one world for ten more coins and a heart if needed.         |
| Five-coin chain  | Collect coins less than 1.7 seconds apart for a two-coin bonus at each multiple of five. |

Pickups and bonk rewards are available once per adventure and survive reloads. Temporary powers and the dash cooldown pause in menus; temporary powers expire on a browser reload. A fresh adventure resets them. Dash lasts 0.24 seconds and recharges in 1.3 seconds.

The finale entrance restores three hearts. Dodge Bowser’s fireballs, then jump onto him while he is tired. Three hits win. Boss damage is retained if Mario loses a life during the fight. The first victory adds fifty coins; replaying the fight cannot farm that reward. The results screen shows a rank, reel collection, best trivia streak, and personal best. Personal best scores survive a new adventure.

Losing the third life shows Game Over and stops play. **Start again** resets coins, answered trivia, Power Stars, pickups, and penalties, restores three lives, and returns Mario to Mushroom Meadow. Sound preferences and personal records are preserved. Lives and Game Over save across reloads; switching between regular worlds does not refill them. The finale entrance is the heart-refilling checkpoint. Older saves keep their progress and receive three lives when first loaded. Wrong trivia answers still cost only one coin, not a life.

## Check

```sh
npm test
npm run build
```

The unit tests cover correct and incorrect answers, star completion, duplicate rewards, and save validation. The build includes strict TypeScript checking.

Browser tests exercise keyboard and touch controls, all nine timed trivia challenges, penalties, lives and Game Over, power-up collection, dash-bonks, crate smashing, healing, saved reels, the locked finale, a complete three-hit boss victory, and personal records:

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
- `src/countdown.ts` — five-second question deadlines and timer cleanup.
- `src/art.ts` — original, procedurally drawn terrain, character sprites, and world illustrations.
- `src/game.ts` — animation, movement, camera, collision, collectibles, and interaction ranges.
- `src/guardian.ts` — Bowser patrols, pursuit, safe areas, and jump/contact rules.
- `src/arcade.ts` — power-up locations, hidden reels, and themed hazard rules.
- `src/arcade-art.ts` — pickup and hazard artwork and the finale arena.
- `src/boss.ts` — fireball patterns, vulnerable phases, and jump attacks.
- `src/main.ts` — game UI, touch controls, trivia dialogs, audio, and persistence.
- `src/style.css` — responsive game shell and dialogs.
- `tests/adventure.spec.ts` — browser playthroughs.

This is a 2D prototype inspired by the exploration and painting portals of Super Mario 64. It has no backend, multiplayer, or 3D platforming. All visuals are drawn locally with Canvas; the app makes no runtime requests for third-party fonts or artwork. The world and question data are separated from the engine so later levels and art can replace the prototype without rewriting the play loop.
