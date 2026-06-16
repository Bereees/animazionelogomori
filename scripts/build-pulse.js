/**
 * Build animated logo: alternating long/short tip pulse, no rotation.
 * Each spike uses the exact triangle from the original path outline.
 */
const fs = require("fs");
const path = require("path");

const CX = 2759.1;
const CY = 2759.1;
const FILL = "#1a1a1a";

const PATH_D =
  "M2759.1,0l108.238,1383.8l240.95,-829.379l-27.138,863.246l530.558,-1282.63l-324.675,1349.52" +
  "l485.446,-714.33l-292.566,812.609l900.95,-1055.9l-725.817,1183.14l682.433,-529.354l-529.358,682.429" +
  "l1183.14,-725.816l-1055.9,900.95l812.608,-292.567l-714.329,485.446l1349.52,-324.675l-1282.63,530.558" +
  "l863.245,-27.137l-829.379,240.95l1383.8,108.237l-1383.8,108.238l829.379,240.95l-863.245,-27.138" +
  "l1282.63,530.559l-1349.52,-324.675l714.329,485.445l-812.608,-292.566l1055.9,900.95l-1183.14,-725.817" +
  "l529.358,682.433l-682.433,-529.358l725.817,1183.14l-900.95,-1055.9l292.566,812.608l-485.445,-714.329" +
  "l324.675,1349.52l-530.559,-1282.63l27.138,863.245l-240.95,-829.379l-108.238,1383.8l-108.237,-1383.8" +
  "l-240.95,829.379l27.137,-863.245l-530.558,1282.63l324.675,-1349.52l-485.446,714.329l292.567,-812.608" +
  "l-900.95,1055.9l725.816,-1183.14l-682.429,529.358l529.354,-682.433l-1183.14,725.817l1055.9,-900.95" +
  "l-812.609,292.566l714.33,-485.445l-1349.52,324.675l1282.63,-530.559l-863.246,27.138l829.379,-240.95" +
  "l-1383.8,-108.238l1383.8,-108.237l-829.379,-240.95l863.246,27.137l-1282.63,-530.558l1349.52,324.675" +
  "l-714.33,-485.446l812.609,292.567l-1055.9,-900.95l1183.14,725.816l-529.354,-682.429l682.429,529.354" +
  "l-725.816,-1183.14l900.95,1055.9l-292.567,-812.609l485.446,714.33l-324.675,-1349.52l530.558,1282.63" +
  "l-27.137,-863.246l240.95,829.379l108.237,-1383.8Z";

function parsePath(d) {
  const tokens = d.match(/[MmLlZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
  const points = [];
  let x = 0;
  let y = 0;
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M" || cmd === "m") {
      let nx = parseFloat(tokens[i++]);
      let ny = parseFloat(tokens[i++]);
      if (cmd === "m") {
        nx += x;
        ny += y;
      }
      x = nx;
      y = ny;
      points.push([x, y]);
    } else if (cmd === "L" || cmd === "l") {
      let nx = parseFloat(tokens[i++]);
      let ny = parseFloat(tokens[i++]);
      if (cmd === "l") {
        nx += x;
        ny += y;
      }
      x = nx;
      y = ny;
      points.push([x, y]);
    } else if (cmd === "Z" || cmd === "z") {
      break;
    }
  }
  return points;
}

function fmt(n) {
  return Number(n.toFixed(3)).toString();
}

function dist(p) {
  return Math.hypot(p[0] - CX, p[1] - CY);
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

const PATH_ATTRS = `fill="${FILL}" stroke="${FILL}" stroke-width="16" stroke-linejoin="round"`;

function triPath(a, b, c) {
  return `M${fmt(a[0])},${fmt(a[1])} L${fmt(b[0])},${fmt(b[1])} L${fmt(c[0])},${fmt(c[1])} Z`;
}

const points = parsePath(PATH_D);
const count = Math.floor(points.length / 4) * 4;
const pts = points.slice(0, count);
const groups = count / 4;

const longDist = dist(pts[0]);
const shortDist = dist(pts[2]);
const innerDist = dist(pts[1]);
const SCALE_LONG_MIN = (shortDist - innerDist) / (longDist - innerDist);
const SCALE_SHORT_MAX = (longDist - innerDist) / (shortDist - innerDist);

const rays = [];
for (let k = 0; k < groups; k++) {
  const i = k * 4;
  const prevInner = pts[(i - 1 + count) % count];
  const longTip = pts[i];
  const innerA = pts[i + 1];
  const shortTip = pts[i + 2];
  const innerB = pts[i + 3];

  const longBase = midpoint(prevInner, innerA);
  const shortBase = midpoint(innerA, innerB);

  rays.push({
    kind: "long",
    d: triPath(prevInner, longTip, innerA),
    ox: longBase[0],
    oy: longBase[1],
  });
  rays.push({
    kind: "short",
    d: triPath(innerA, shortTip, innerB),
    ox: shortBase[0],
    oy: shortBase[1],
  });
}

// Inner fill: expanded circle to overlap ray bases and remove white gaps
const CORE_OVERLAP = 48;
const coreRadius = innerDist + CORE_OVERLAP;

const rayMarkup = rays
  .map((r) => {
    const style = `transform-origin: ${fmt(r.ox)}px ${fmt(r.oy)}px`;
    return `    <g class="ray ray-${r.kind}" style="${style}"><path d="${r.d}" ${PATH_ATTRS}/></g>`;
  })
  .join("\n");

const svg = `<svg viewBox="0 0 5519 5519" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="logo-annamori-svg">
  <g id="sun">
    <circle class="sun-core" cx="${fmt(CX)}" cy="${fmt(CY)}" r="${fmt(coreRadius)}" ${PATH_ATTRS}/>
${rayMarkup}
  </g>
</svg>
`;

const css = `/* Logo Annamori — pulse alternato punte */

.logo-annamori {
  display: inline-block;
  line-height: 0;
}

.logo-annamori svg,
.logo-annamori-svg {
  width: 120px;
  height: auto;
  display: block;
  shape-rendering: geometricPrecision;
}

:root {
  --ray-long-min: ${SCALE_LONG_MIN.toFixed(4)};
  --ray-short-max: ${SCALE_SHORT_MAX.toFixed(4)};
}

@keyframes ray-pulse-long {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(var(--ray-long-min)); }
}

@keyframes ray-pulse-short {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(var(--ray-short-max)); }
}

.ray-long {
  animation: ray-pulse-long 2s ease-in-out infinite;
}

.ray-short {
  animation: ray-pulse-short 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ray-long,
  .ray-short {
    animation: none;
  }
}
`;

const root = path.join(__dirname, "..");
fs.writeFileSync(path.join(root, "logoannamori-animated.svg"), svg, "utf8");
fs.writeFileSync(path.join(root, "logo-annamori.css"), css, "utf8");

const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logo Annamori — Preview</title>
  <link rel="stylesheet" href="logo-annamori.css">
  <style>
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
    }
  </style>
</head>
<body>
  <div class="logo-annamori">
${svg.trim()}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), html, "utf8");

const elementor = `<!-- Logo Annamori — incolla in Elementor > Widget HTML -->
<div class="logo-annamori-wrap">
<style>
.logo-annamori-wrap {
  display: inline-block;
  line-height: 0;
}
.logo-annamori-wrap svg {
  width: 120px;
  height: auto;
  display: block;
}
.logo-annamori-wrap {
  --ray-long-min: ${SCALE_LONG_MIN.toFixed(4)};
  --ray-short-max: ${SCALE_SHORT_MAX.toFixed(4)};
}
@keyframes logo-ray-long {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(var(--ray-long-min)); }
}
@keyframes logo-ray-short {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(var(--ray-short-max)); }
}
.logo-annamori-wrap .ray-long { animation: logo-ray-long 2s ease-in-out infinite; }
.logo-annamori-wrap .ray-short { animation: logo-ray-short 2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .logo-annamori-wrap .ray-long,
  .logo-annamori-wrap .ray-short { animation: none; }
}
</style>
${svg.trim()}
</div>
`;

fs.writeFileSync(path.join(root, "elementor-snippet.html"), elementor, "utf8");

console.log(`Built ${rays.length} rays (${groups} long + ${groups} short)`);
console.log(`Scale: long min=${SCALE_LONG_MIN.toFixed(4)}, short max=${SCALE_SHORT_MAX.toFixed(4)}`);
