import { worldById, type FilmWorldId, type WorldId } from "./content";

export const MAP_W = 1280;
export const MAP_H = 850;
type Ctx = CanvasRenderingContext2D;

export const palettes = {
  finale: {
    grass: "#493843",
    speck: "#47333a",
    light: "#b48c6f",
    path: "#756568",
    edge: "#a87c60",
    leaf: "#805751",
    tree: "#4c3c47",
    water: "#e07a47",
  },
  hub: {
    grass: "#96bf79",
    speck: "#82af68",
    light: "#a9ce88",
    path: "#eddcb3",
    edge: "#cfbb8e",
    leaf: "#4d8b5a",
    tree: "#39764d",
    water: "#78bec4",
  },
  jungle: {
    grass: "#79a46a",
    speck: "#67965a",
    light: "#8db77a",
    path: "#d9c499",
    edge: "#b6a179",
    leaf: "#327d53",
    tree: "#276449",
    water: "#6baaa3",
  },
  galaxy: {
    grass: "#c6a887",
    speck: "#b6977c",
    light: "#d4b99a",
    path: "#ead2a8",
    edge: "#ac8b74",
    leaf: "#737190",
    tree: "#565b78",
    water: "#9eafc3",
  },
  castle: {
    grass: "#a7a8a0",
    speck: "#979c94",
    light: "#b7b6a9",
    path: "#d9c6b1",
    edge: "#b09d92",
    leaf: "#737e7b",
    tree: "#536b66",
    water: "#849fae",
  },
};

const hash = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function rounded(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export function shadow(ctx: Ctx, x: number, y: number, w = 35, h = 11) {
  ctx.fillStyle = "#244a3b28";
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function star(
  ctx: Ctx,
  x: number,
  y: number,
  size: number,
  color = "#ffd34f",
  face = true,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? size : size * 0.48;
    const sx = Math.cos(angle) * radius,
      sy = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#a8792f";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
  if (face) {
    ctx.fillStyle = "#66502d";
    ctx.fillRect(-size * 0.24, -size * 0.2, size * 0.12, size * 0.4);
    ctx.fillRect(size * 0.12, -size * 0.2, size * 0.12, size * 0.4);
  }
  ctx.restore();
}

function tree(ctx: Ctx, x: number, y: number, world: WorldId, scale = 1) {
  const p = palettes[world];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  shadow(ctx, 3, 7, 31, 12);
  ctx.fillStyle = "#81664b";
  ctx.fillRect(-8, -33, 17, 39);
  ctx.fillStyle = "#a17d54";
  ctx.fillRect(-7, -27, 6, 32);
  if (world === "galaxy") {
    ctx.fillStyle = p.tree;
    ctx.fillRect(-7, -77, 16, 56);
    ctx.fillRect(-24, -56, 23, 13);
    ctx.fillRect(-26, -72, 11, 25);
    ctx.fillRect(3, -46, 25, 11);
    ctx.fillRect(19, -65, 12, 25);
    ctx.fillStyle = p.leaf;
    ctx.fillRect(-4, -73, 5, 45);
    ctx.fillRect(21, -60, 4, 19);
  } else if (world === "castle") {
    ctx.fillStyle = p.tree;
    ctx.beginPath();
    ctx.moveTo(0, -111);
    ctx.lineTo(-35, -61);
    ctx.lineTo(-22, -61);
    ctx.lineTo(-43, -24);
    ctx.lineTo(43, -24);
    ctx.lineTo(22, -61);
    ctx.lineTo(35, -61);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.leaf;
    ctx.beginPath();
    ctx.moveTo(-3, -100);
    ctx.lineTo(-27, -62);
    ctx.lineTo(-14, -62);
    ctx.lineTo(-33, -31);
    ctx.lineTo(-2, -31);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = p.tree;
    ctx.beginPath();
    ctx.roundRect(-43, -80, 86, 56, 19);
    ctx.roundRect(-32, -108, 64, 53, 17);
    ctx.fill();
    ctx.fillStyle = p.leaf;
    ctx.beginPath();
    ctx.roundRect(-39, -86, 73, 50, 16);
    ctx.roundRect(-28, -111, 53, 45, 15);
    ctx.fill();
    ctx.fillStyle = world === "jungle" ? "#4b9561" : "#6b9e65";
    ctx.fillRect(-23, -102, 25, 8);
    ctx.fillRect(-34, -75, 16, 9);
    ctx.fillRect(9, -82, 17, 8);
    ctx.fillRect(-10, -49, 22, 7);
    if (world === "hub" && x % 3 < 1.5) {
      ctx.fillStyle = "#e6b159";
      ctx.fillRect(-21, -68, 7, 8);
      ctx.fillRect(19, -53, 7, 8);
    }
  }
  ctx.restore();
}

export function bush(
  ctx: Ctx,
  x: number,
  y: number,
  world: WorldId,
  width = 48,
) {
  shadow(ctx, x, y + 2, width / 2, 8);
  const p = palettes[world];
  rounded(ctx, x - width / 2, y - 24, width, 28, 9, p.tree);
  rounded(ctx, x - width / 2 + 2, y - 28, width - 6, 23, 9, p.leaf);
  ctx.fillStyle = world === "hub" ? "#88b275" : p.light;
  ctx.fillRect(x - width / 2 + 10, y - 23, 13, 4);
}

function flower(ctx: Ctx, x: number, y: number, color: string) {
  ctx.fillStyle = "#5c9256";
  ctx.fillRect(x, y, 2, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x - 3, y - 4, 8, 4);
  ctx.fillRect(x - 1, y - 6, 4, 8);
  ctx.fillStyle = "#fce9b6";
  ctx.fillRect(x, y - 3, 2, 2);
}

function path(ctx: Ctx, world: WorldId) {
  const p = palettes[world];
  ctx.lineCap = "square";
  ctx.lineJoin = "round";
  const routes =
    world === "hub"
      ? [
          [
            [640, 220],
            [640, 780],
          ],
          [
            [230, 454],
            [1060, 454],
          ],
          [
            [300, 454],
            [300, 714],
          ],
          [
            [300, 680],
            [1050, 680],
          ],
        ]
      : [
          [
            [640, 780],
            [640, 690],
            [360, 690],
            [360, 385],
            [890, 385],
            [890, 650],
            [640, 650],
          ],
          [
            [640, 385],
            [640, 230],
          ],
        ];
  for (const [index, color] of [p.edge, p.path].entries()) {
    ctx.strokeStyle = color;
    ctx.lineWidth = index === 0 ? 82 : 72;
    for (const points of routes) {
      ctx.beginPath();
      points.forEach(([x, y], i) =>
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y),
      );
      ctx.stroke();
    }
  }
  // Stepping stones leave plenty of open space for the player.
  ctx.fillStyle = "#fff6de35";
  for (let i = 0; i < 35; i++) {
    const x =
      world === "hub" ? 620 + hash(i + 90) * 34 : 336 + hash(i + 90) * 44;
    ctx.fillRect(x, 340 + i * 12, 5 + hash(i) * 6, 3);
  }
}

function pond(ctx: Ctx, world: WorldId) {
  const p = palettes[world];
  const x = world === "hub" ? 1070 : 185,
    y = 630;
  rounded(ctx, x - 96, y - 78, 184, 140, 43, p.edge);
  rounded(ctx, x - 89, y - 83, 172, 133, 39, p.water);
  ctx.fillStyle = "#d7f1df65";
  for (let i = 0; i < 13; i++)
    ctx.fillRect(
      x - 65 + hash(i + 9) * 120,
      y - 60 + hash(i + 19) * 84,
      12 + hash(i) * 20,
      3,
    );
  if (world !== "galaxy") {
    ctx.fillStyle = "#6eaa73";
    ctx.beginPath();
    ctx.ellipse(x + 27, y + 3, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    flower(ctx, x + 27, y - 1, "#f6d0cf");
    ctx.fillStyle = "#6eaa73";
    ctx.beginPath();
    ctx.ellipse(x - 34, y - 40, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fence(ctx: Ctx, x: number, y: number, count: number) {
  ctx.fillStyle = "#9c835f";
  ctx.fillRect(x - 4, y - 23, count * 26, 6);
  ctx.fillRect(x - 4, y - 10, count * 26, 6);
  for (let i = 0; i <= count; i++) {
    ctx.fillStyle = "#e5cf9b";
    ctx.fillRect(x + i * 26 - 5, y - 32, 9, 37);
    ctx.fillStyle = "#c1a873";
    ctx.fillRect(x + i * 26 + 1, y - 29, 3, 34);
  }
}

function mushroom(ctx: Ctx, x: number, y: number, color = "#d76d62", size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  shadow(ctx, 0, 4, 17, 6);
  rounded(ctx, -8, -15, 16, 21, 5, "#f7e8c9");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -17, 22, 17, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(22, -10);
  ctx.lineTo(-22, -10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff6df";
  ctx.fillRect(-12, -27, 7, 8);
  ctx.fillRect(4, -30, 8, 8);
  ctx.fillRect(-2, -19, 7, 7);
  ctx.fillStyle = "#5f5346";
  ctx.fillRect(-4, -6, 2, 5);
  ctx.fillRect(3, -6, 2, 5);
  ctx.restore();
}

function palace(ctx: Ctx, x: number, y: number, magic = false) {
  shadow(ctx, x, y + 17, 170, 23);
  const wall = magic ? "#b0a6b1" : "#f5e8d4",
    shade = magic ? "#867b92" : "#d7c6b2",
    roof = magic ? "#645c7f" : "#d37777";
  ctx.fillStyle = shade;
  ctx.fillRect(x - 127, y - 119, 254, 128);
  ctx.fillStyle = wall;
  ctx.fillRect(x - 127, y - 133, 254, 128);
  ctx.fillStyle = shade;
  ctx.fillRect(x - 141, y - 11, 282, 18);
  for (const side of [-1, 1]) {
    const tx = x + side * 119;
    ctx.fillStyle = shade;
    ctx.fillRect(tx - 27, y - 155, 56, 163);
    ctx.fillStyle = wall;
    ctx.fillRect(tx - 27, y - 155, 47, 157);
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(tx - 42, y - 154);
    ctx.lineTo(tx, y - 221);
    ctx.lineTo(tx + 42, y - 154);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff33";
    ctx.beginPath();
    ctx.moveTo(tx - 35, y - 158);
    ctx.lineTo(tx, y - 211);
    ctx.lineTo(tx - 3, y - 158);
    ctx.closePath();
    ctx.fill();
    rounded(ctx, tx - 8, y - 129, 16, 31, 8, "#768c92");
    ctx.fillStyle = "#bdc7bd";
    ctx.fillRect(tx - 5, y - 125, 4, 22);
    ctx.fillStyle = "#8a8b70";
    ctx.fillRect(tx, y - 241, 3, 23);
    ctx.fillStyle = "#e3aa5a";
    ctx.beginPath();
    ctx.moveTo(tx + 3, y - 241);
    ctx.lineTo(tx + 28, y - 232);
    ctx.lineTo(tx + 3, y - 225);
    ctx.fill();
  }
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 117, y - 131);
  ctx.lineTo(x, y - 196);
  ctx.lineTo(x + 117, y - 131);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff22";
  ctx.beginPath();
  ctx.moveTo(x - 104, y - 134);
  ctx.lineTo(x, y - 187);
  ctx.lineTo(x + 39, y - 134);
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.fillRect(x - 42, y - 84, 84, 83);
  ctx.fillStyle = "#88776d";
  ctx.beginPath();
  ctx.roundRect(x - 29, y - 71, 58, 80, [28, 28, 0, 0]);
  ctx.fill();
  ctx.fillStyle = "#ac8b67";
  ctx.beginPath();
  ctx.roundRect(x - 24, y - 67, 48, 75, [23, 23, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = "#8c7054";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 63);
  ctx.lineTo(x, y + 7);
  ctx.stroke();
  ctx.fillStyle = "#f1d987";
  ctx.fillRect(x - 9, y - 21, 3, 4);
  ctx.fillRect(x + 6, y - 21, 3, 4);
  for (const wx of [-77, 77]) {
    rounded(ctx, x + wx - 10, y - 91, 20, 35, 10, "#8199a0");
    ctx.fillStyle = "#d0dbcc";
    ctx.fillRect(x + wx - 6, y - 85, 5, 20);
  }
  ctx.fillStyle = "#ede4d2";
  ctx.fillRect(x - 44, y + 6, 88, 9);
  ctx.fillStyle = "#c8b79e";
  ctx.fillRect(x - 54, y + 15, 108, 7);
  star(ctx, x, y - 125, 14, "#f3cb70", false);
}

function fountain(ctx: Ctx, x: number, y: number) {
  shadow(ctx, x, y + 12, 68, 24);
  ctx.fillStyle = "#b4b6a2";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 64, 35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e1dfc3";
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 64, 33, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7fb9b7";
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 53, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8dbc5";
  ctx.beginPath();
  ctx.ellipse(x, y - 7, 43, 18, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#b9e2d4";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#b7b8a1";
  ctx.fillRect(x - 8, y - 51, 16, 49);
  ctx.fillStyle = "#e7e3c7";
  ctx.fillRect(x - 9, y - 54, 13, 48);
  ctx.fillStyle = "#e4dfc1";
  ctx.beginPath();
  ctx.ellipse(x, y - 50, 32, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#92c8bd";
  ctx.beginPath();
  ctx.ellipse(x, y - 54, 25, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  star(ctx, x, y - 80, 21, "#f6d169");
}

function pipe(ctx: Ctx, x: number, y: number) {
  shadow(ctx, x, y + 5, 35, 12);
  ctx.fillStyle = "#3b7a53";
  ctx.fillRect(x - 25, y - 52, 50, 59);
  ctx.fillStyle = "#6aa86c";
  ctx.fillRect(x - 22, y - 48, 28, 53);
  ctx.fillStyle = "#9ec67b";
  ctx.fillRect(x - 17, y - 48, 7, 53);
  ctx.fillStyle = "#3b7a53";
  ctx.fillRect(x - 33, y - 64, 66, 22);
  ctx.fillStyle = "#76ac6e";
  ctx.fillRect(x - 30, y - 62, 60, 17);
  ctx.fillStyle = "#aacb89";
  ctx.fillRect(x - 27, y - 60, 9, 13);
  ctx.fillStyle = "#2e5c42";
  ctx.beginPath();
  ctx.ellipse(x, y - 64, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function portal(
  ctx: Ctx,
  x: number,
  y: number,
  world: FilmWorldId,
  complete = false,
) {
  const data = worldById(world);
  shadow(ctx, x, y + 11, 51, 16);
  rounded(ctx, x - 53, y - 15, 106, 33, 8, "#aaa890");
  rounded(ctx, x - 49, y - 21, 98, 27, 5, "#e4ddbd");
  rounded(ctx, x - 43, y - 128, 86, 119, [40, 40, 3, 3], data.dark);
  ctx.fillStyle =
    world === "jungle" ? "#6c9e6c" : world === "galaxy" ? "#9d9dcc" : "#b58eab";
  ctx.beginPath();
  ctx.roundRect(x - 31, y - 116, 62, 101, [30, 30, 0, 0]);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - 29, y - 114, 58, 98, [28, 28, 0, 0]);
  ctx.clip();
  thumbnail(ctx, world, x - 31, y - 115, 62, 101);
  ctx.restore();
  ctx.strokeStyle = "#e5c788";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 36, y - 122, 72, 111, [35, 35, 0, 0]);
  ctx.stroke();
  // Film perforations make the warp gates feel like tiny cinema screens.
  ctx.fillStyle = "#efdfb2";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x - 43, y - 84 + i * 15, 5, 7);
    ctx.fillRect(x + 38, y - 84 + i * 15, 5, 7);
  }
  star(ctx, x, y - 129, 13, complete ? "#ffdc69" : "#f5e8bd", false);
  label(ctx, x, y + 38, data.name, "#fff5d9", data.dark);
}

export function label(
  ctx: Ctx,
  x: number,
  y: number,
  text: string,
  color = "#f9f2dd",
  bg = "#42634fe8",
) {
  ctx.font = "bold 12px monospace";
  const width = ctx.measureText(text).width + 22;
  rounded(ctx, x - width / 2, y - 14, width, 24, 5, bg);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 2);
}

export function questionBlock(
  ctx: Ctx,
  x: number,
  y: number,
  done: boolean,
  t: number,
  index: number,
) {
  const bob = Math.sin(t * 2 + index) * 3;
  shadow(ctx, x, y + 5, 23, 8);
  if (!done) {
    ctx.strokeStyle = "#fff7c33d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 35 + Math.sin(t * 2) * 3, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = done ? "#89937a" : "#b48a3f";
  ctx.fillRect(x - 20, y - 40 + bob, 40, 39);
  ctx.fillStyle = done ? "#afb29a" : "#f3c564";
  ctx.fillRect(x - 20, y - 44 + bob, 36, 35);
  ctx.fillStyle = done ? "#c5c6ac" : "#ffe39a";
  ctx.fillRect(x - 17, y - 41 + bob, 30, 4);
  ctx.fillRect(x - 17, y - 41 + bob, 4, 29);
  ctx.fillStyle = done ? "#586a57" : "#9b6f31";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(done ? "✓" : "?", x - 1, y - 16 + bob);
  ctx.fillStyle = "#af8544";
  for (const dx of [-13, 9])
    for (const dy of [-36, -17]) ctx.fillRect(x + dx, y + dy + bob, 3, 3);
}

export function mario(
  ctx: Ctx,
  x: number,
  y: number,
  jump: number,
  moving: boolean,
  t: number,
  direction: number,
) {
  const sprite = [
    ".....RRRRRR.....",
    "....RRRRRRRRR...",
    "....BBBSSBS.....",
    "...BSBSSSBSSS...",
    "...BSBBSSSBS....",
    "....BSSSSBBBB...",
    ".....SSSSSS.....",
    "....RRORORR.....",
    "...RRROOORRR....",
    "..SSROYOYORSS...",
    "..SSOOOOOOOSS...",
    "....OOOOOOO.....",
    "....OOO.OOO.....",
    "...BBB...BBB....",
    "..BBBB...BBBB...",
  ];
  const colors: Record<string, string> = {
    R: "#d7473f",
    B: "#654838",
    S: "#ffd5a0",
    O: "#447ca3",
    Y: "#f7d36b",
  };
  shadow(ctx, x, y + 3, 16 - jump * 0.04, 6 - jump * 0.01);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - jump));
  const stride = moving && jump === 0 ? Math.sin(t * 15) * 2 : 0;
  if (direction < 0) ctx.scale(-1, 1);
  const s = 2.55;
  for (let row = 0; row < sprite.length; row++)
    for (let col = 0; col < sprite[row].length; col++) {
      const color = colors[sprite[row][col]];
      if (!color) continue;
      ctx.fillStyle = color;
      const leg = row > 11 ? (col < 8 ? stride : -stride) : 0;
      ctx.fillRect(
        Math.round((col - 8) * s),
        Math.round((row - 15) * s + leg),
        Math.ceil(s),
        Math.ceil(s),
      );
    }
  ctx.restore();
}

export function bowser(
  ctx: Ctx,
  x: number,
  y: number,
  t: number,
  direction: number,
  chasing: boolean,
  stunned: boolean,
) {
  shadow(ctx, x, y + 4, 28, 10);
  if (chasing) {
    ctx.strokeStyle = "#bd664b88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 36, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(direction, 1);
  const stride = stunned ? 0 : Math.sin(t * (chasing ? 11 : 7)) * 3;
  // Tail, feet, and golden body sit beneath a chunky, spiked shell.
  ctx.fillStyle = "#b5823b";
  ctx.beginPath();
  ctx.moveTo(-23, -19);
  ctx.lineTo(-44, -5);
  ctx.lineTo(-18, -3);
  ctx.closePath();
  ctx.fill();
  rounded(ctx, -22, -12 + stride, 20, 15, 4, "#c18b43");
  rounded(ctx, 9, -11 - stride, 22, 15, 4, "#d3a34f");
  ctx.fillStyle = "#f0dfb4";
  for (const fx of [-20, -13, 14, 21])
    ctx.fillRect(fx, (fx < 0 ? stride : -stride) - 1, 4, 5);
  rounded(ctx, -22, -42, 45, 37, 12, "#b5833e");
  rounded(ctx, 2, -34, 28, 29, 9, "#e1bd79");
  ctx.fillStyle = "#ba975e";
  for (const fy of [-25, -17]) ctx.fillRect(11, fy, 16, 2);
  rounded(ctx, -27, -50, 43, 39, 12, "#e7d4a2");
  rounded(ctx, -24, -49, 36, 33, 10, "#3f6f43");
  rounded(ctx, -21, -47, 27, 26, 7, "#62934f");
  ctx.strokeStyle = "#3f7043";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -47);
  ctx.lineTo(-14, -35);
  ctx.lineTo(-6, -22);
  ctx.moveTo(-23, -34);
  ctx.lineTo(-14, -35);
  ctx.lineTo(8, -32);
  ctx.stroke();
  ctx.fillStyle = "#f8e7bf";
  for (const [sx, sy] of [
    [-18, -44],
    [-4, -43],
    [-22, -29],
    [-8, -28],
  ]) {
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy + 4);
    ctx.lineTo(sx, sy - 9);
    ctx.lineTo(sx + 6, sy + 4);
    ctx.closePath();
    ctx.fill();
  }
  // A red mane, two horns, and a toothy snout make the silhouette familiar.
  ctx.fillStyle = "#b7513d";
  ctx.beginPath();
  ctx.moveTo(4, -38);
  ctx.lineTo(6, -54);
  ctx.lineTo(14, -48);
  ctx.lineTo(17, -58);
  ctx.lineTo(24, -47);
  ctx.lineTo(29, -52);
  ctx.lineTo(35, -36);
  ctx.closePath();
  ctx.fill();
  rounded(ctx, 12, -43, 29, 28, 9, "#d4a04a");
  ctx.fillStyle = "#f5e4ba";
  ctx.beginPath();
  ctx.moveTo(15, -40);
  ctx.lineTo(18, -54);
  ctx.lineTo(24, -41);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(32, -38);
  ctx.lineTo(44, -46);
  ctx.lineTo(40, -32);
  ctx.closePath();
  ctx.fill();
  rounded(ctx, 29, -27, 20, 16, 5, "#e5c887");
  ctx.fillStyle = "#f7efcf";
  ctx.fillRect(29, -36, 9, 9);
  ctx.fillStyle = stunned ? "#936d42" : "#343d30";
  ctx.fillRect(35, -34, 3, 6);
  ctx.fillStyle = "#a94835";
  ctx.fillRect(27, -39, 13, 4);
  ctx.fillStyle = "#9c7846";
  ctx.fillRect(43, -23, 3, 3);
  ctx.fillRect(37, -15, 10, 2);
  ctx.fillStyle = "#fff0cd";
  ctx.fillRect(38, -15, 3, 5);
  rounded(ctx, 7, -17 - stride, 18, 13, 5, "#d3a04a");
  ctx.fillStyle = "#444a38";
  ctx.fillRect(12, -18 - stride, 6, 14);
  ctx.fillStyle = "#e6d3a1";
  ctx.fillRect(13, -15 - stride, 4, 3);
  ctx.restore();
  label(
    ctx,
    x,
    y + 23,
    stunned ? "BOWSER · STUNNED" : "BOWSER",
    "#ffedbf",
    chasing ? "#9b5542ee" : "#596247e6",
  );
}

export function coin(ctx: Ctx, x: number, y: number, t: number, index: number) {
  const bob = Math.sin(t * 3 + index * 0.6) * 3;
  shadow(ctx, x, y + 3, 8, 3);
  const w = 6 + Math.abs(Math.sin(t * 2 + index)) * 4;
  ctx.fillStyle = "#b78936";
  ctx.beginPath();
  ctx.ellipse(x + 1, y - 12 + bob, w, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7cf62";
  ctx.beginPath();
  ctx.ellipse(x - 1, y - 14 + bob, w, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffedab";
  ctx.fillRect(x - 3, y - 22 + bob, 3, 13);
}

export function thumbnail(
  ctx: Ctx,
  world: FilmWorldId,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / 220, h / 130);
  if (world === "jungle") {
    ctx.fillStyle = "#a5c7a0";
    ctx.fillRect(0, 0, 220, 130);
    ctx.fillStyle = "#c7d8ab";
    ctx.beginPath();
    ctx.arc(154, 42, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#80a782";
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(60, 26);
    ctx.lineTo(111, 83);
    ctx.lineTo(177, 50);
    ctx.lineTo(220, 68);
    ctx.lineTo(220, 130);
    ctx.lineTo(0, 130);
    ctx.fill();
    ctx.fillStyle = "#4d7c5e";
    ctx.fillRect(0, 99, 220, 31);
    for (const tx of [10, 35, 193, 217]) {
      ctx.fillStyle = "#395e46";
      ctx.fillRect(tx, 47, 7, 83);
      ctx.beginPath();
      ctx.moveTo(tx + 3, 38);
      ctx.lineTo(tx - 30, 65);
      ctx.lineTo(tx + 4, 54);
      ctx.lineTo(tx + 32, 63);
      ctx.lineTo(tx + 15, 43);
      ctx.lineTo(tx + 2, 45);
      ctx.fill();
    }
    // A gentle long-neck dinosaur silhouette.
    ctx.fillStyle = "#315d48";
    ctx.beginPath();
    ctx.ellipse(121, 97, 31, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(140, 54, 11, 43);
    ctx.beginPath();
    ctx.ellipse(150, 56, 14, 7, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(103, 105, 7, 25);
    ctx.fillRect(132, 105, 7, 25);
    ctx.beginPath();
    ctx.moveTo(98, 93);
    ctx.lineTo(67, 111);
    ctx.lineTo(98, 105);
    ctx.fill();
  } else if (world === "galaxy") {
    ctx.fillStyle = "#5f6085";
    ctx.fillRect(0, 0, 220, 130);
    ctx.fillStyle = "#e5c89c";
    ctx.beginPath();
    ctx.arc(167, 31, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ccb9bd";
    ctx.beginPath();
    ctx.arc(128, 44, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b69fa2";
    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(70, 62);
    ctx.lineTo(164, 90);
    ctx.lineTo(220, 69);
    ctx.lineTo(220, 130);
    ctx.lineTo(0, 130);
    ctx.fill();
    ctx.fillStyle = "#d0b7a5";
    ctx.fillRect(0, 106, 220, 24);
    ctx.fillStyle = "#e5cdb1";
    ctx.beginPath();
    ctx.arc(89, 100, 25, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(64, 98, 50, 24);
    ctx.fillStyle = "#74677c";
    ctx.fillRect(83, 105, 12, 17);
    ctx.fillStyle = "#e5cdb1";
    ctx.fillRect(135, 78, 13, 43);
    ctx.fillRect(130, 73, 23, 8);
    ctx.fillStyle = "#e7ddc4";
    for (let i = 0; i < 12; i++)
      ctx.fillRect(hash(i + 3) * 220, hash(i + 55) * 65, 2, 2);
  } else {
    ctx.fillStyle = "#a89aaf";
    ctx.fillRect(0, 0, 220, 130);
    ctx.fillStyle = "#dfc8c9";
    ctx.beginPath();
    ctx.arc(161, 32, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#817c96";
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(40, 64);
    ctx.lineTo(87, 109);
    ctx.lineTo(150, 83);
    ctx.lineTo(220, 106);
    ctx.lineTo(220, 130);
    ctx.lineTo(0, 130);
    ctx.fill();
    ctx.fillStyle = "#655d7b";
    ctx.fillRect(69, 56, 82, 74);
    ctx.fillRect(58, 39, 18, 91);
    ctx.fillRect(144, 26, 19, 104);
    ctx.fillRect(104, 37, 22, 93);
    ctx.fillStyle = "#494c68";
    for (const [tx, ty, tw] of [
      [54, 39, 26],
      [140, 26, 27],
      [100, 37, 30],
    ]) {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + tw / 2, ty - 25);
      ctx.lineTo(tx + tw, ty);
      ctx.fill();
    }
    ctx.fillStyle = "#e4c99b";
    for (const [wx, wy] of [
      [65, 56],
      [151, 43],
      [111, 58],
      [91, 87],
      [130, 95],
    ])
      ctx.fillRect(wx, wy, 4, 8);
    ctx.fillStyle = "#4d5861";
    ctx.fillRect(0, 122, 220, 8);
  }
  ctx.restore();
}

export function createTerrain(world: WorldId): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_W;
  canvas.height = MAP_H;
  const ctx = canvas.getContext("2d")!;
  const p = palettes[world];
  ctx.fillStyle = p.grass;
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  // Seeded terrain: no image downloads or frame-to-frame visual noise.
  for (let i = 0; i < 1900; i++) {
    const x = Math.floor((hash(i + 1) * MAP_W) / 4) * 4,
      y = Math.floor((hash(i + 3001) * MAP_H) / 4) * 4;
    ctx.fillStyle = i % 4 ? p.speck + "70" : p.light;
    ctx.fillRect(x, y, i % 5 ? 3 : 7, 2);
    if (i % 6 === 0) ctx.fillRect(x + 3, y - 3, 2, 4);
  }
  path(ctx, world);
  pond(ctx, world);
  for (let i = 0; i < 68; i++) {
    const x = hash(i + 900) * MAP_W,
      y = hash(i + 800) * MAP_H;
    if ((x > 225 && x < 1060 && y > 290 && y < 760) || y < 200) continue;
    flower(ctx, x, y, ["#f8e6b0", "#e4a9a2", "#ecdbb6"][i % 3]);
  }
  for (let i = 0; i < 17; i++) {
    const x = 30 + i * 78;
    tree(ctx, x, 65 + hash(i) * 35, world, 0.9 + hash(i + 3) * 0.2);
    if (x < 450 || x > 810)
      tree(ctx, x + 25, 162 + hash(i + 20) * 25, world, 1);
  }
  for (let i = 0; i < 8; i++) {
    tree(ctx, 40 + hash(i) * 45, 270 + i * 82, world, 0.9);
    tree(ctx, 1203 + hash(i + 8) * 39, 255 + i * 87, world, 1.02);
  }
  for (let i = 0; i < 16; i++)
    tree(ctx, 35 + i * 84, 886 + hash(i) * 20, world, 1);
  for (const [x, y] of [
    [450, 330],
    [820, 260],
    [1050, 325],
    [460, 580],
    [760, 760],
    [1120, 790],
    [175, 450],
    [176, 800],
  ])
    bush(ctx, x, y, world, 42 + hash(x) * 25);
  if (world === "hub") {
    palace(ctx, 640, 305);
    fountain(ctx, 640, 452);
    fence(ctx, 433, 322, 3);
    fence(ctx, 770, 322, 3);
    for (const [x, y, c] of [
      [475, 326, "#e9b7ad"],
      [798, 327, "#fff1ba"],
      [540, 360, "#fff1ba"],
      [728, 360, "#e9b7ad"],
    ] as [number, number, string][])
      flower(ctx, x, y, c);
    pipe(ctx, 1058, 733);
    mushroom(ctx, 474, 748);
    mushroom(ctx, 828, 566, "#d6b36e", 0.7);
    mushroom(ctx, 195, 576, "#cb8073", 1.5);
    ctx.fillStyle = "#9a7956";
    ctx.fillRect(773, 612, 6, 42);
    rounded(ctx, 736, 598, 80, 34, 3, "#e9d5a6");
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#776447";
    ctx.fillText("LET’S-A GO!", 776, 619);
  } else if (world === "jungle") {
    // Fossil excavation, jungle gate, and a sleeping dinosaur.
    ctx.fillStyle = "#c5b995";
    ctx.fillRect(508, 182, 264, 94);
    ctx.fillStyle = "#b5aa87";
    ctx.fillRect(519, 192, 243, 73);
    ctx.strokeStyle = "#eee0b8";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(640, 235, 72, 18, -0.1, 0.3, Math.PI * 1.8);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(591 + i * 20, 216);
      ctx.lineTo(587 + i * 20, 253);
      ctx.stroke();
    }
    for (const x of [535, 745]) {
      ctx.fillStyle = "#81765c";
      ctx.fillRect(x, 174, 16, 123);
    }
    ctx.fillStyle = "#e4d1a4";
    ctx.fillRect(519, 153, 257, 42);
    ctx.fillStyle = "#4d6445";
    ctx.font = "bold 19px monospace";
    ctx.textAlign = "center";
    ctx.fillText("JURASSIC JUNGLE", 646, 182);
    ctx.save();
    ctx.translate(1060, 570);
    shadow(ctx, 0, 25, 66, 21);
    ctx.fillStyle = "#537e52";
    ctx.beginPath();
    ctx.ellipse(0, -6, 64, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(39, -78, 21, 73);
    ctx.beginPath();
    ctx.ellipse(64, -78, 28, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a8ba7d";
    ctx.fillRect(55, -91, 30, 8);
    ctx.strokeStyle = "#355d41";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(70, -79);
    ctx.lineTo(79, -79);
    ctx.stroke();
    ctx.fillStyle = "#466e47";
    ctx.fillRect(-34, 10, 18, 30);
    ctx.fillRect(22, 10, 18, 30);
    ctx.restore();
    mushroom(ctx, 785, 750, "#d4af67");
  } else if (world === "galaxy") {
    for (const [x, y, r] of [
      [603, 266, 85],
      [1040, 610, 61],
      [191, 328, 51],
    ]) {
      shadow(ctx, x, y + 4, r, 22);
      ctx.fillStyle = "#ddc7a5";
      ctx.beginPath();
      ctx.arc(x, y - 50, r, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - r, y - 50, r * 2, 63);
      ctx.fillStyle = "#c9af93";
      ctx.fillRect(x + r - 20, y - 49, 20, 60);
      rounded(ctx, x - 19, y - 36, 38, 49, [19, 19, 0, 0], "#766f7e");
      ctx.fillStyle = "#c6bba2";
      ctx.fillRect(x - r - 5, y + 6, r * 2 + 10, 10);
    }
    ctx.fillStyle = "#6c687b";
    ctx.fillRect(742, 136, 8, 149);
    ctx.fillRect(713, 152, 68, 6);
    ctx.fillRect(726, 131, 40, 8);
    ctx.fillStyle = "#c6c5c7";
    ctx.fillRect(704, 145, 22, 22);
    pipe(ctx, 473, 549);
    label(ctx, 640, 131, "MOS EISLEY · OUTPOST 02", "#f9e4be", "#635b78");
  } else {
    palace(ctx, 640, 307, true);
    for (const x of [490, 790]) {
      ctx.fillStyle = "#8a8091";
      ctx.fillRect(x, 285, 10, 66);
      ctx.fillStyle = "#eac886";
      ctx.fillRect(x - 6, 273, 22, 18);
      ctx.fillStyle = "#fff1bb";
      ctx.fillRect(x, 268, 10, 20);
    }
    for (let i = 0; i < 5; i++) {
      mushroom(ctx, 1005 + i * 22, 603 + hash(i) * 18, "#c99369", 0.7);
    }
    fence(ctx, 1015, 506, 5);
  }
  return canvas;
}
