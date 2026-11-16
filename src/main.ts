import "./style.css";
import { Game, type Interaction } from "./game";
import { QuestionCountdown, QUESTION_TIME_LIMIT_MS } from "./countdown";
import { thumbnail } from "./art";
import {
  worlds,
  isFilmWorld,
  worldById,
  type FilmWorldId,
  type Question,
  type WorldId,
} from "./content";
import {
  answerQuestion,
  coinCount,
  earnedStar,
  freshProgress,
  isGameOver,
  MAX_LIVES,
  parseProgress,
  SAVE_KEY,
  starCount,
  reelCount,
} from "./state";

const icons: Record<string, string> = {
  star: '<path d="m12 2 3 6.3 7 .9-5.1 4.9 1.3 7-6.2-3.4-6.2 3.4 1.3-7L2 9.2l7-.9Z"/><path d="M10 10v3m4-3v3"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z"/><path d="M9 3v16m6-14v16"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c3-1.5 6-1 10 1 4-2 7-2.5 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
  volume:
    '<path d="m11 4-5 4H2v8h4l5 4V4Z"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  muted: '<path d="m11 4-5 4H2v8h4l5 4V4Z"/><path d="m16 9 5 6m0-6-5 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
  jump: '<path d="M12 18V4m-5 5 5-5 5 5M5 19v3h14v-3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  coin: '<ellipse cx="12" cy="12" rx="8" ry="10"/><path d="M12 7v10"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  flag: '<path d="M5 22V3m0 0c4-3 8 3 14 0v10c-6 3-10-3-14 0"/>',
};
const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;

let storageAvailable = true;
let progress = freshProgress();
try {
  progress = parseProgress(localStorage.getItem(SAVE_KEY));
} catch {
  storageAvailable = false;
}
const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="Screenworld home"><span class="brand-icon">${icon("star")}</span><span>screen<span class="brand-world">world</span><small>A MOVIE-SIZED ADVENTURE</small></span></a>
    <nav class="primary-nav" aria-label="Main navigation">
      <button class="nav-item active" id="adventure-nav">${icon("compass")}<span>Adventure</span></button>
      <button class="nav-item" id="map-nav">${icon("map")}<span>World map</span></button>
      <button class="nav-item" id="guide-nav">${icon("book")}<span>Field guide</span></button>
    </nav>
    <div class="header-tools"><span class="save-indicator"><i></i> <span id="save-label">Progress saved</span></span><button class="icon-button sound-toggle" aria-label="Turn sound on" aria-pressed="false">${icon("muted")}</button></div>
  </header>
  <main>
    <section class="heading-row" aria-labelledby="page-title">
      <div><div class="eyebrow" id="world-eyebrow">WELCOME TO THE MUSHROOM KINGDOM</div><h1 id="page-title">A whole new world of <span>movie magic.</span></h1><p id="page-subtitle">Jump. Dash. Discover. Make every scene a blockbuster.</p></div>
      <button class="adventure-progress" id="progress-button" aria-label="View Power Star collection"><span class="progress-star">${icon("star")}</span><span><small>YOUR ADVENTURE</small><strong><span id="star-progress">0 of 3</span> <span>Power Stars</span></strong></span><span class="progress-dots" aria-hidden="true"><i></i><i></i><i></i></span></button>
    </section>

    <section class="game-frame" aria-label="Playable adventure">
      <div class="game-toolbar"><div class="live-world"><span class="live-dot"></span><span id="scene-label">PEACH’S PICTURE PALACE</span><span class="world-number" id="world-number">WORLD 00</span></div><div class="game-hud"><span class="coin-hud">${icon("coin")}<b id="coin-count">00</b></span><span class="hud-divider"></span><span class="lives-hud" id="lives-hud" role="img" aria-label="3 of 3 lives remaining"></span><span class="hud-divider"></span><span class="star-hud">${icon("star")}<b id="star-count">0</b><span>/ 3</span></span><button id="help-button" class="icon-button" aria-label="How to play">${icon("help")}</button></div></div>
      <div class="arcade-strip"><span id="reel-status">FILM REELS 0 / 9</span><span id="streak-status">STREAK ×0</span><span id="power-status">DASH READY</span></div>
      <div class="game-stage" id="game-stage">
        <div class="boss-hud" id="boss-hud" hidden><small>THE FINAL CUT · BOWSER</small><div id="boss-health" role="meter" aria-label="Bowser health" aria-valuemin="0" aria-valuemax="3" aria-valuenow="3">● ● ●</div><strong id="boss-phase">Get ready!</strong></div>
        <canvas id="game" tabindex="0" aria-label="Screenworld game. Use arrow keys or WASD to move, Space to jump, Shift to dash, and E to interact. Jump onto crates to smash them. On touch screens use the joystick and action buttons."></canvas>
        <div class="location-card"><span class="location-icon">${icon("flag")}</span><div><small id="location-type">THE HUB</small><strong id="location-name">Mushroom Meadow</strong></div></div>
        <div class="quest-card" id="quest-card"><span class="quest-icon">${icon("star")}</span><div><small>YOUR NEXT SCENE</small><strong id="quest-title">Find your first film world</strong><p id="quest-description">Step into a painting. Every great story starts with a little curiosity.</p></div></div>
        <button class="back-hub" id="back-hub" hidden>${icon("back")} Back to hub</button>
        <div class="enemy-warning" id="enemy-warning" hidden><span class="enemy-dot"></span><span><strong>BOWSER PATROL</strong><small>Jump / dash to bonk · Bump: -1 life</small></span></div>
        <div class="scene-chapter" id="scene-chapter"><span>EXPLORE. DISCOVER. PLAY.</span><strong>Adventure is<br>just a warp away.</strong></div>
        <div class="game-controls">
          <div class="joystick-area"><button id="joystick" class="joystick" aria-label="Movement joystick. Drag in a direction to move Mario."><span class="joystick-cross"></span><span class="joystick-knob"></span></button><span class="control-caption">MOVE <kbd>W A S D</kbd></span></div>
          <div class="interaction-prompt" id="interaction-prompt" hidden><kbd>E</kbd><span id="interaction-label"></span></div>
          <div class="action-controls"><div><button class="dash-button" id="dash-button" aria-label="Dash">${icon("bolt")}</button><span class="control-caption">DASH <kbd>SHIFT</kbd></span></div><div><button class="jump-button" id="jump-button" aria-label="Jump">${icon("jump")}</button><span class="control-caption">JUMP <kbd>SPACE</kbd></span></div><div><button class="interact-button" id="interact-button" aria-label="Interact with nearby object" disabled><span>A</span></button><span class="control-caption">INTERACT <kbd>E</kbd></span></div></div>
        </div>
        <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
        <div id="world-transition" class="world-transition" aria-hidden="true"></div>
      </div>
      <div class="game-footer"><span><span class="mini-mario" aria-hidden="true">M</span>You’re playing as <strong>Mario</strong></span><span class="desktop-tip">${icon("compass")} Follow the coins. Find the clues. Know the movies.</span><button id="footer-help">Controls & tips ${icon("arrow")}</button></div>
    </section>

    <section class="worlds-section" aria-labelledby="worlds-heading"><div class="section-heading"><div><span class="eyebrow">A TICKET TO SOMEWHERE NEW</span><h2 id="worlds-heading">Pick your next picture.</h2></div><span class="worlds-meta">3 worlds. Countless “I know this one!” moments.</span></div><div id="world-cards" class="world-cards"></div></section>
    <button class="finale-card" id="finale-card" disabled><span class="finale-symbol">${icon("flag")}</span><span><small>THE FINAL CUT</small><strong id="finale-card-title">Bowser’s premiere awaits.</strong><span id="finale-card-note">Collect all 3 Power Stars to unlock the showdown.</span></span><span class="finale-card-arrow">${icon("arrow")}</span></button>
    <footer class="site-footer"><span>Made for the love of games <span class="footer-spark">✦</span> and the magic of movies.</span><span>One more reel. One more run. One more perfect take.</span></footer>
  </main>
  <dialog id="modal" aria-labelledby="modal-title"><button class="modal-close icon-button" aria-label="Close dialog">${icon("close")}</button><div id="modal-content"></div></dialog>
`;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const modal = $<HTMLDialogElement>("#modal");
const modalContent = $("#modal-content");
let currentWorld: WorldId = "hub";
let audioContext: AudioContext | null = null;
let toastTimer: ReturnType<typeof setTimeout>;
let transitioning = false;
let bestScore = 0;
try {
  const stored = Number(localStorage.getItem("screenworld-best-score"));
  bestScore = Number.isSafeInteger(stored) && stored > 0 ? stored : 0;
} catch {
  /* Session play remains available. */
}
function rememberBest() {
  bestScore = Math.max(bestScore, coinCount(progress));
  try {
    localStorage.setItem("screenworld-best-score", String(bestScore));
  } catch {
    /* Keep the session record. */
  }
}
let activeQuestionTimer: QuestionCountdown | null = null;

function stopQuestionTimer() {
  activeQuestionTimer?.stop();
  activeQuestionTimer = null;
}

function sound(kind: "coin" | "jump" | "correct" | "wrong" | "warp") {
  if (!progress.sound) return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    const tones: Record<typeof kind, number[]> = {
      coin: [880, 1318],
      jump: [260, 520],
      correct: [523, 659, 784, 1047],
      wrong: [220, 185],
      warp: [660, 523, 440, 330],
    };
    tones[kind].forEach((frequency, i) => {
      const oscillator = audioContext!.createOscillator(),
        gain = audioContext!.createGain();
      const start = audioContext!.currentTime + i * 0.09;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.17);
    });
  } catch {
    /* Silent play remains available when a browser has no Web Audio. */
  }
}

function toast(message: string) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 3800);
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  $("#save-label").textContent = storageAvailable
    ? "Progress saved"
    : "Session only";
  $(".save-indicator").classList.toggle("unsaved", !storageAvailable);
}

function drawThumbnails(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLCanvasElement>("canvas[data-thumb]")
    .forEach((canvas) => {
      const ctx = canvas.getContext("2d")!;
      thumbnail(
        ctx,
        canvas.dataset.thumb as FilmWorldId,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    });
}

function worldCard(id: FilmWorldId, compact = false) {
  const world = worldById(id),
    completed = earnedStar(progress, id);
  const count = world.questions.filter((question) =>
    progress.answered.includes(question.id),
  ).length;
  return `<button class="world-card ${compact ? "compact" : ""} ${completed ? "completed" : ""}" data-world="${id}" style="--world-color:${world.color};--world-dark:${world.dark}">
    <div class="world-art"><canvas width="440" height="260" data-thumb="${id}" aria-hidden="true"></canvas><span class="genre-tag">${world.genre}</span>${completed ? `<span class="complete-badge">${icon("star")} STAR EARNED</span>` : ""}</div>
    <div class="world-card-info"><span class="world-card-number">${world.number}</span><div><h3>${world.name}</h3><p>${world.subtitle}</p></div><span class="card-arrow">${icon(currentWorld === id ? "flag" : "arrow")}</span></div>
    <div class="world-card-status"><span>${completed ? "A picture-perfect performance" : count ? `${count} of 3 scenes complete` : `3 scenes · ${reelCount(progress, id)} / 3 film reels`}</span><span class="mini-stars">${[0, 1, 2].map((i) => `<i class="${i < count ? "filled" : ""}"></i>`).join("")}</span></div>
  </button>`;
}

function bindWorldCards(root: ParentNode) {
  root.querySelectorAll<HTMLButtonElement>("[data-finale]").forEach((button) =>
    button.addEventListener("click", () => {
      modal.close();
      enterWorld("finale");
    }),
  );
  drawThumbnails(root);
  root.querySelectorAll<HTMLButtonElement>("[data-world]").forEach((button) =>
    button.addEventListener("click", () => {
      modal.close();
      enterWorld(button.dataset.world as FilmWorldId);
    }),
  );
}

function updateUI() {
  const stars = starCount(progress);
  $("#reel-status").textContent = isFilmWorld(currentWorld)
    ? `FILM REELS ${reelCount(progress, currentWorld)} / 3`
    : currentWorld === "finale"
      ? "FINAL SHOWDOWN"
      : `FILM REELS ${reelCount(progress)} / 9`;
  $("#streak-status").textContent = `STREAK ×${progress.streak}`;
  $<HTMLButtonElement>("#finale-card").disabled = stars < 3;
  $("#finale-card-title").textContent = progress.bossDefeated
    ? "Take an encore with Bowser."
    : stars === 3
      ? "The final showdown is unlocked!"
      : "Bowser’s premiere awaits.";
  $("#finale-card-note").textContent =
    stars === 3
      ? "Dodge the fireballs. Jump when he’s tired. Take the crown."
      : `${stars} / 3 Power Stars · Your biggest scene is still to come.`;
  $("#boss-hud").hidden = currentWorld !== "finale";
  $("#lives-hud").innerHTML = Array.from(
    { length: MAX_LIVES },
    (_, i) =>
      `<span class="life-heart${i >= progress.lives ? " lost" : ""}">${icon("heart")}</span>`,
  ).join("");
  $("#lives-hud").setAttribute(
    "aria-label",
    `${progress.lives} of ${MAX_LIVES} lives remaining`,
  );
  $("#lives-hud").classList.toggle("critical", progress.lives === 1);
  $("#coin-count").textContent = String(coinCount(progress)).padStart(2, "0");
  $("#star-count").textContent = String(stars);
  $("#star-progress").textContent = `${stars} of 3`;
  document
    .querySelectorAll(".progress-dots i")
    .forEach((dot, i) => dot.classList.toggle("filled", i < stars));
  document
    .querySelectorAll<HTMLButtonElement>(".sound-toggle")
    .forEach((button) => {
      button.innerHTML = icon(progress.sound ? "volume" : "muted");
      button.setAttribute(
        "aria-label",
        progress.sound ? "Turn sound off" : "Turn sound on",
      );
      button.setAttribute("aria-pressed", String(progress.sound));
    });
  if (currentWorld === "hub") {
    $("#world-eyebrow").textContent = "WELCOME TO THE MUSHROOM KINGDOM";
    $("#page-title").innerHTML =
      "A whole new world of <span>movie magic.</span>";
    $("#page-subtitle").textContent =
      "Jump. Dash. Discover. Make every scene a blockbuster.";
    $("#scene-label").textContent = "PEACH’S PICTURE PALACE";
    $("#world-number").textContent = "WORLD 00";
    $("#location-type").textContent = "THE HUB";
    $("#location-name").textContent = "Mushroom Meadow";
    $("#quest-title").textContent =
      stars === 3
        ? "Your grand finale awaits"
        : stars
          ? "The next story is waiting"
          : "Find your first film world";
    $("#quest-description").textContent =
      stars === 3
        ? "All 3 stars are yours! Visit the palace or enter The Final Cut to face Bowser."
        : "Step into a painting. Every great story starts with a little curiosity.";
  } else if (currentWorld === "finale") {
    $("#world-eyebrow").textContent = "THE FINAL CUT · BOSS SHOWDOWN";
    $("#page-title").innerHTML = "One last <span>show-stopping jump.</span>";
    $("#page-subtitle").textContent =
      "Dodge the fireballs. When Bowser gets tired, jump onto him. Three hits take the crown.";
    $("#scene-label").textContent = "BOWSER’S PREMIERE";
    $("#world-number").textContent = "FINAL BOSS";
  } else {
    const world = worldById(currentWorld);
    const count = world.questions.filter((question) =>
      progress.answered.includes(question.id),
    ).length;
    $("#world-eyebrow").textContent = `WORLD ${world.number} · ${world.genre}`;
    $("#page-title").innerHTML =
      `${world.name}<span class="title-dot">.</span>`;
    $("#page-subtitle").textContent = world.description;
    $("#scene-label").textContent = world.name.toUpperCase();
    $("#world-number").textContent = `WORLD ${world.number}`;
    $("#location-type").textContent = world.genre + " WORLD";
    $("#location-name").textContent = world.subtitle;
    $("#quest-title").textContent =
      count === 3 ? "That’s a wrap!" : `${count} of 3 scenes complete`;
    $("#quest-description").textContent =
      count === 3
        ? "A Power Star is yours. Return to the hub and discover your next picture."
        : "Find the ? blocks. Smash crates, hunt reels, and dash past danger!";
  }
  $("#back-hub").hidden = currentWorld === "hub";
  $("#enemy-warning").hidden = !isFilmWorld(currentWorld);
  $("#scene-chapter").hidden = currentWorld !== "hub";
  $("#game-stage").dataset.world = currentWorld;
  $("#world-cards").innerHTML = worlds
    .map((world) => worldCard(world.id))
    .join("");
  bindWorldCards($("#world-cards"));
  $("#save-label").textContent = storageAvailable
    ? "Progress saved"
    : "Session only";
}

function openDialog(html: string, className = "") {
  stopQuestionTimer();
  game.setPaused(true);
  $(".modal-close").hidden = isGameOver(progress);
  modal.className = className;
  modalContent.innerHTML = html;
  if (!modal.open) modal.showModal();
  modalContent.scrollTop = 0;
}

function enterWorld(world: WorldId) {
  stopQuestionTimer();
  if (isGameOver(progress)) {
    showGameOver();
    return;
  }
  if (world === "finale" && starCount(progress) !== 3) {
    toast("Collect all three Power Stars to unlock Bowser’s premiere.");
    return;
  }
  if (transitioning) return;
  transitioning = true;
  game.setPaused(true);
  $("#world-transition").classList.add("visible");
  sound("warp");
  setTimeout(() => {
    currentWorld = world;
    if (world === "finale") {
      progress.lives = MAX_LIVES;
      save();
    }
    game.enter(world);
    updateUI();
    $("#world-transition").classList.remove("visible");
    game.setPaused(false);
    transitioning = false;
    toast(
      world === "hub"
        ? "Back in the Mushroom Kingdom. Your next adventure awaits!"
        : world === "finale"
          ? "Final showdown! Three fresh hearts. Dodge the fire, then JUMP when Bowser is tired!"
          : `${worldById(world).name} · Reels, power-ups, and hidden loot await. Shift / ⚡ to dash!`,
    );
    $(".game-frame").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#game").focus({ preventScroll: true });
  }, 220);
}

function showQuestion(question: Question) {
  const world = worldById(currentWorld as FilmWorldId);
  const count = world.questions.filter((q) =>
    progress.answered.includes(q.id),
  ).length;
  openDialog(
    `<div class="quiz-art"><canvas width="660" height="240" data-thumb="${world.id}" aria-hidden="true"></canvas><span class="modal-overline">WORLD ${world.number} · ${world.name.toUpperCase()}</span><span class="quiz-number">SCENE ${world.questions.indexOf(question) + 1} / 3</span><span class="quiz-block">?</span></div>
    <div class="quiz-body"><div class="quiz-heading-row"><div><div class="eyebrow">LIGHTS. CAMERA. YOUR ANSWER.</div><h2 id="modal-title">${question.title}</h2></div><div class="quiz-timer" id="quiz-timer" role="timer" aria-live="off" aria-label="5 seconds remaining"><span>${icon("clock")}<strong id="quiz-seconds">5s</strong></span><small id="quiz-timer-caption">TIME LEFT</small></div></div><div class="quiz-time-track" aria-hidden="true"><span id="quiz-time-bar"></span></div><p class="question-text">${question.prompt}</p><div class="answer-options">${question.options.map((option, index) => `<button class="answer-option" data-answer="${index}"><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span><span class="answer-result"></span></button>`).join("")}</div><div id="answer-feedback" role="status" aria-live="polite"></div><div class="quiz-bottom"><span>${icon("coin")} Correct +5 · Fast +2 · Streak bonus</span><span>${count} / 3 scenes complete</span></div></div>`,
    "quiz-dialog",
  );
  drawThumbnails(modalContent);
  const buttons = [
    ...modalContent.querySelectorAll<HTMLButtonElement>("[data-answer]"),
  ];
  const timerElement = $("#quiz-timer");
  const secondsLabel = $("#quiz-seconds");
  const timerCaption = $("#quiz-timer-caption");
  const timeBar = $("#quiz-time-bar");
  const rejectedOptions = new Set<number>();
  let settled = false;
  const countdown = new QuestionCountdown({
    onTick: (remaining) => {
      const seconds = Math.ceil(remaining / 1000);
      const text = `${seconds}s`;
      if (secondsLabel.textContent !== text) {
        secondsLabel.textContent = text;
        timerElement.setAttribute("aria-label", `${seconds} seconds remaining`);
      }
      timeBar.style.transform = `scaleX(${remaining / QUESTION_TIME_LIMIT_MS})`;
      timerElement.classList.toggle("urgent", remaining <= 2000);
      timeBar.classList.toggle("urgent", remaining <= 2000);
    },
    onExpire: () => finishQuestion(null),
  });

  function startAttempt() {
    settled = false;
    timerElement.classList.remove("stopped");
    timerCaption.textContent = "TIME LEFT";
    activeQuestionTimer = countdown;
    countdown.start();
  }

  function finishQuestion(option: number | null, remainingMs = 0) {
    if (settled || !modal.open || !modalContent.contains(timerElement)) return;
    settled = true;
    const timedOut = option === null;
    const before = coinCount(progress);
    const correct = answerQuestion(progress, question.id, option, remainingMs);
    const reward = coinCount(progress) - before;
    buttons.forEach((button) => {
      button.disabled = true;
    });
    if (option !== null) {
      const selected = buttons[option];
      selected.classList.add(correct ? "correct" : "incorrect");
      selected.querySelector(".answer-result")!.innerHTML = icon(
        correct ? "check" : "close",
      );
      if (!correct) rejectedOptions.add(option);
    }
    timerElement.classList.add("stopped");
    timerCaption.textContent = timedOut ? "TIME’S UP" : "ANSWERED";
    sound(correct ? "correct" : "wrong");
    save();
    updateUI();
    if (correct) {
      const complete = earnedStar(progress, world.id);
      $("#answer-feedback").innerHTML =
        `<div class="feedback correct-feedback"><strong>${complete ? "Power Star earned! A stellar performance." : `Nice take! +${reward} coins · ${progress.streak} in a row`}</strong><p>${question.fact}</p></div><button class="primary-button feedback-continue">${complete ? `${icon("star")} Collect your Power Star` : "Keep exploring " + icon("arrow")}</button>`;
      $(".feedback-continue").addEventListener("click", () => {
        modal.close();
        game.celebrate();
        toast(
          complete
            ? `★ ${world.name} complete! ${starCount(progress)} of 3 Power Stars collected.`
            : "Scene complete! Follow the coins to your next challenge.",
        );
      });
    } else {
      $("#answer-feedback").innerHTML =
        `<div class="feedback wrong-feedback"><strong>${timedOut ? "Time’s up — give it another take." : "Not quite — give it another take."}</strong><p>-1 coin. ${timedOut ? "Try again with a fresh five seconds." : "You’ve got this!"}</p></div><button class="primary-button feedback-retry">Try again (5 seconds) ${icon("arrow")}</button>`;
      $(".feedback-retry").addEventListener("click", () => {
        $("#answer-feedback").innerHTML = "";
        buttons.forEach((button, index) => {
          button.disabled = rejectedOptions.has(index);
        });
        buttons.find((button) => !button.disabled)?.focus();
        startAttempt();
      });
    }
  }

  buttons.forEach((button, index) =>
    button.addEventListener("click", () => {
      const remaining = countdown.remainingMs;
      if (countdown.trySubmit()) finishQuestion(index, remaining);
    }),
  );
  startAttempt();
}

function showMap() {
  openDialog(
    `<div class="modal-heading"><span class="eyebrow">THREE TICKETS. THREE BIG ADVENTURES.</span><h2 id="modal-title">Where to next?</h2><p>Pick a painting and jump into a different kind of story.</p></div><div class="map-worlds">${worlds.map((world) => worldCard(world.id, true)).join("")}</div><button class="map-finale" data-finale ${starCount(progress) < 3 ? "disabled" : ""}>${icon("flag")} ${starCount(progress) === 3 ? "Enter The Final Cut · Bowser showdown" : "The Final Cut · Collect all 3 Power Stars"} ${icon("arrow")}</button><button class="text-button map-home">${icon("back")} Return to Mushroom Meadow</button>`,
    "map-dialog",
  );
  bindWorldCards(modalContent);
  $(".map-home").addEventListener("click", () => {
    modal.close();
    enterWorld("hub");
  });
}

function showGuide() {
  const stars = starCount(progress);
  openDialog(
    `<div class="modal-heading"><span class="eyebrow">SOUVENIRS FROM YOUR ADVENTURE</span><h2 id="modal-title">The field guide.</h2><p>Every great explorer keeps a few good stories.</p></div><div class="collection-summary"><div>${icon("star")}<strong>${stars}<small>/ 3 Power Stars</small></strong></div><div>${icon("coin")}<strong>${coinCount(progress)}<small>coin score</small></strong></div></div><div class="journal-worlds">${worlds.map((world) => `<div class="journal-world"><canvas width="176" height="120" data-thumb="${world.id}" aria-hidden="true"></canvas><div><strong>${world.name}</strong><p>${world.questions.filter((q) => progress.answered.includes(q.id)).length} of 3 scenes complete · ${reelCount(progress, world.id)}/3 reels</p></div><span class="journal-star ${earnedStar(progress, world.id) ? "earned" : ""}">${icon("star")}</span></div>`).join("")}</div><div class="guide-note">${icon("book")}<p>Your progress saves automatically in this browser. Your best streak: ${progress.bestStreak}. Hidden reels: ${reelCount(progress)}/9. Personal best: ${bestScore} coins. Find all 3 Power Stars to unlock Bowser’s showdown.</p></div><button class="text-button" id="reset-progress">Start a new adventure</button>`,
    "guide-dialog",
  );
  drawThumbnails(modalContent);
  $("#reset-progress").addEventListener("click", () => {
    openDialog(
      `<div class="modal-heading"><span class="eyebrow">A FRESH START</span><h2 id="modal-title">Another take?</h2><p>This clears your coins, answered trivia, and Power Stars, and restores all 3 lives.</p></div><div class="confirm-actions"><button class="secondary-button" id="cancel-reset">Keep my adventure</button><button class="primary-button" id="confirm-reset">Start fresh ${icon("arrow")}</button></div>`,
      "small-dialog",
    );
    $("#cancel-reset").addEventListener("click", showGuide);
    $("#confirm-reset").addEventListener("click", () => {
      restartAdventure();
    });
  });
}

function restartAdventure() {
  const soundEnabled = progress.sound;
  Object.assign(progress, freshProgress(), { sound: soundEnabled });
  game.resetRunEffects();
  clearTimeout(toastTimer);
  $("#toast").hidden = true;
  save();
  updateUI();
  modal.close();
  enterWorld("hub");
}

function showGameOver() {
  if (!isGameOver(progress)) return;
  rememberBest();
  clearTimeout(toastTimer);
  $("#toast").hidden = true;
  openDialog(
    `<div class="game-over-hearts" aria-hidden="true">${icon("heart")}${icon("heart")}${icon("heart")}</div><div class="modal-heading"><span class="eyebrow">EVERY HERO GETS ANOTHER TAKE</span><h2 id="modal-title">Game Over</h2><p>You’re out of lives. A new adventure starts in Mushroom Meadow with three fresh hearts.</p></div><div class="game-over-score"><span>${icon("star")} ${starCount(progress)} / 3 Power Stars</span><span>${icon("coin")} ${coinCount(progress)} coin score</span></div><p class="restart-note">Personal best: ${bestScore} coins. Starting again resets this adventure; your record stays.</p><button class="primary-button" id="restart-adventure">Start again ${icon("arrow")}</button>`,
    "game-over-dialog",
  );
  $("#restart-adventure").addEventListener("click", restartAdventure);
}

function showHelp() {
  openDialog(
    `<div class="modal-heading"><span class="eyebrow">SMALL HERO. BIG BLOCKBUSTER.</span><h2 id="modal-title">Ready, player one?</h2><p>Stunts, secrets, movie trivia, and one very big final scene.</p></div><div class="help-steps"><div><span>01</span><div><h3>Move like a movie hero</h3><p><kbd>WASD</kbd> or the joystick moves Mario. <kbd>Space</kbd> jumps. <kbd>Shift</kbd> or ⚡ dashes through danger. Press <kbd>E</kbd> or A near a painting or question block.</p></div></div><div><span>02</span><div><h3>Make the risky route worth it</h3><p>Jump or dash into crates for coins and a 10-second magnet. Super Stars give 8 seconds of invincibility. Mushrooms restore a heart. Find all 3 hidden film reels in a world for +10 coins and a heart. Bonk Bowser for a bonus!</p></div></div><div><span>03</span><div><h3>Go for the perfect take</h3><p>Each question has 5 seconds. Correct answers earn 5 coins; answer within 2 seconds for +2. Consecutive correct answers build a streak worth up to +4 more! Wrong answers and timeouts cost 1 coin and break the streak. Collect 5 coins quickly for a chain bonus.</p></div></div><div><span>04</span><div><h3>Save the premiere</h3><p>Three lives, three film worlds, three Power Stars. Hazards and Bowser bumps cost a life and a coin. Three lost lives means Game Over. Once all stars are yours, enter The Final Cut. Dodge the fireballs, then jump onto Bowser when he’s tired. Three hits win!</p></div></div></div><button class="primary-button" id="help-play">Let’s-a go! ${icon("arrow")}</button>`,
    "help-dialog",
  );
  $("#help-play").addEventListener("click", () => modal.close());
}

function showPalace() {
  if (progress.bossDefeated) {
    showVictory();
    return;
  }
  const complete = starCount(progress) === 3;
  openDialog(
    `<div class="palace-celebration">${icon("star")}${icon("star")}${icon("star")}</div><div class="modal-heading"><span class="eyebrow">PEACH’S PICTURE PALACE</span><h2 id="modal-title">${complete ? "Your final scene awaits!" : "Every star tells a story."}</h2><p>${complete ? "Bowser has crashed the premiere! Dodge his fireballs and jump onto him when he’s tired. Three good jumps win the crown. You’ll enter with three fresh hearts." : "Collect the three film worlds’ Power Stars, then return for a showdown worthy of the big screen."}</p></div><button class="primary-button" id="palace-continue">${complete ? "Challenge Bowser" : "Keep exploring"} ${icon("arrow")}</button>`,
    `palace-dialog ${complete ? "all-complete" : ""}`,
  );
  $("#palace-continue").addEventListener("click", () => {
    modal.close();
    if (complete) enterWorld("finale");
  });
}

function showVictory() {
  rememberBest();
  const score = coinCount(progress),
    rank = score >= 180 ? "S" : score >= 120 ? "A" : "B";
  openDialog(
    `<div class="victory-crown">${icon("star")}</div><div class="modal-heading"><span class="eyebrow">BOWSER BEATEN. PREMIERE SAVED.</span><h2 id="modal-title">You’re a screen legend!</h2><p>Three worlds. Nine scenes. One spectacular final jump. Take a bow, Mario.</p></div><div class="victory-rank"><strong>${rank}</strong><span>YOUR FINAL CUT<small>${score} coins · Personal best ${bestScore}</small></span></div><div class="victory-medals"><span>★ ${starCount(progress)} Power Stars</span><span>◉ ${reelCount(progress)}/9 hidden reels</span><span>⚡ Best streak ×${progress.bestStreak}</span></div><p class="restart-note">Beat your record by finding every reel, chaining coins, and answering fast. The first boss victory awards +50 coins.</p><button class="primary-button" id="victory-lap">Take a victory lap ${icon("arrow")}</button><button class="text-button" id="victory-new-run">Start a new adventure</button>`,
    "victory-dialog",
  );
  $("#victory-lap").addEventListener("click", () => {
    modal.close();
    enterWorld("hub");
  });
  $("#victory-new-run").addEventListener("click", restartAdventure);
}

function handleInteraction(interaction: Interaction) {
  if (interaction.type === "portal") enterWorld(interaction.world);
  else if (interaction.type === "question") showQuestion(interaction.question);
  else if (interaction.type === "exit") enterWorld("hub");
  else if (interaction.type === "palace") showPalace();
  else if (interaction.type === "toad") {
    openDialog(
      `<div class="toad-portrait" aria-hidden="true">🍄</div><div class="modal-heading"><span class="eyebrow">TOAD · RESIDENT FILM BUFF</span><h2 id="modal-title">Oh hey, Mario!</h2><p>Peach’s paintings have turned into portals! I knew movie night was getting a little out of hand.</p><p>Jump into a painting, follow the coins, and find the golden question blocks. Three right answers will earn you a Power Star. Need a shortcut? Check your World map!</p></div><button class="primary-button" id="toad-continue">On my way! ${icon("arrow")}</button>`,
      "small-dialog",
    );
    $("#toad-continue").addEventListener("click", () => modal.close());
  }
}

const game = new Game({
  canvas: $<HTMLCanvasElement>("#game"),
  progress,
  onInteract: handleInteraction,
  onNearby: (interaction) => {
    $("#interaction-prompt").hidden = !interaction;
    $("#interaction-label").textContent = interaction?.label || "";
    $<HTMLButtonElement>("#interact-button").disabled = !interaction;
    $("#interact-button").setAttribute(
      "aria-label",
      interaction?.label || "Interact with nearby object",
    );
  },
  onCollect: () => {
    save();
    sound("coin");
    $("#coin-count").textContent = String(coinCount(progress)).padStart(2, "0");
  },
  onJump: () => sound("jump"),
  onArcadeEvent: (message) => {
    save();
    updateUI();
    sound("coin");
    toast(message);
  },
  onArcadeStatus: (status) => {
    $<HTMLButtonElement>("#dash-button").disabled =
      status.dashPercent < 0.999 || isGameOver(progress);
    $("#dash-button").style.setProperty(
      "--dash-charge",
      String(status.dashPercent),
    );
    $("#power-status").textContent = status.power
      ? `${status.power} ${status.powerSeconds}s`
      : status.dashPercent >= 0.999
        ? "DASH READY"
        : "DASH RECHARGING";
    $("#power-status").classList.toggle("powered", !!status.power);
    $("#streak-status").textContent =
      status.combo >= 2
        ? `COIN CHAIN ×${status.combo}`
        : `STREAK ×${progress.streak}`;
    if (currentWorld === "finale") {
      $("#boss-health").textContent = Array.from({ length: 3 }, (_, i) =>
        i < status.bossHealth ? "●" : "○",
      ).join(" ");
      $("#boss-health").setAttribute(
        "aria-valuenow",
        String(status.bossHealth),
      );
      $("#boss-health").dataset.health = String(status.bossHealth);
      $("#boss-phase").textContent =
        (
          {
            warning: "Watch the wind-up…",
            attack: "Dodge the fireballs!",
            tired: "NOW! Jump onto Bowser!",
            hit: "Direct hit!",
            defeated: "That’s a wrap!",
          } as Record<string, string>
        )[status.bossPhase] || "Get ready!";
      $("#boss-hud").dataset.phase = status.bossPhase;
    }
  },
  onVictory: () => {
    save();
    updateUI();
    sound("correct");
    setTimeout(() => {
      if (progress.bossDefeated) showVictory();
    }, 450);
  },
  onEnemyHit: (cause) => {
    save();
    sound("wrong");
    updateUI();
    if (isGameOver(progress)) showGameOver();
    else
      toast(
        `${cause === "Bowser" ? "Bowser bump" : cause === "fireball" ? "Fireball hit" : "Hazard hit"}! -1 life and -1 coin. ${progress.lives} ${progress.lives === 1 ? "life" : "lives"} left. Back to the entrance!`,
      );
  },
});

modal.addEventListener("close", () => {
  stopQuestionTimer();
  if (isGameOver(progress)) showGameOver();
  else game.setPaused(transitioning);
});
modal.addEventListener("cancel", (event) => {
  if (isGameOver(progress)) event.preventDefault();
});
$(".modal-close").addEventListener("click", () => {
  if (!isGameOver(progress)) modal.close();
});
modal.addEventListener("click", (event) => {
  if (isGameOver(progress)) return;
  if (event.target === modal) {
    const box = modal.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      modal.close();
  }
});
$("#map-nav").addEventListener("click", showMap);
$("#guide-nav").addEventListener("click", showGuide);
$("#adventure-nav").addEventListener("click", () => {
  modal.close();
  $(".game-frame").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#game").focus({ preventScroll: true });
});
$(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  if (currentWorld !== "hub") enterWorld("hub");
  else window.scrollTo({ top: 0, behavior: "smooth" });
});
$("#progress-button").addEventListener("click", showGuide);
$("#help-button").addEventListener("click", showHelp);
$("#footer-help").addEventListener("click", showHelp);
$("#back-hub").addEventListener("click", () => enterWorld("hub"));
$("#jump-button").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  game.jump();
});
$("#jump-button").addEventListener("click", (event) => {
  if (event.detail === 0) game.jump();
});
$("#dash-button").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  game.dash();
});
$("#dash-button").addEventListener("click", (event) => {
  if (event.detail === 0) game.dash();
});
$("#finale-card").addEventListener("click", () => enterWorld("finale"));
$("#interact-button").addEventListener("click", () => game.interact());
$(".sound-toggle").addEventListener("click", () => {
  progress.sound = !progress.sound;
  save();
  updateUI();
  if (progress.sound) sound("coin");
});

const joystick = $<HTMLButtonElement>("#joystick"),
  knob = $(".joystick-knob");
let joystickPointer: number | null = null;
function moveJoystick(event: PointerEvent) {
  if (joystickPointer !== event.pointerId) return;
  const box = joystick.getBoundingClientRect();
  let x = (event.clientX - box.left - box.width / 2) / 29,
    y = (event.clientY - box.top - box.height / 2) / 29;
  const length = Math.max(1, Math.hypot(x, y));
  x /= length;
  y /= length;
  knob.style.transform = `translate(${x * 24}px, ${y * 24}px)`;
  game.setStick(Math.abs(x) < 0.12 ? 0 : x, Math.abs(y) < 0.12 ? 0 : y);
}
function releaseJoystick() {
  joystickPointer = null;
  knob.style.transform = "";
  game.setStick(0, 0);
}
joystick.addEventListener("pointerdown", (event) => {
  if (game.paused) return;
  event.preventDefault();
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  moveJoystick(event);
});
joystick.addEventListener("pointermove", moveJoystick);
joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);
joystick.addEventListener("lostpointercapture", releaseJoystick);
window.addEventListener("blur", releaseJoystick);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) activeQuestionTimer?.refresh();
});
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    stopQuestionTimer();
    game.destroy();
    if (audioContext) void audioContext.close();
  }
});
updateUI();
if (isGameOver(progress)) showGameOver();
