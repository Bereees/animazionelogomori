/** Split monolithic sun SVG path into individual ray paths. */
const fs = require("fs");
const path = require("path");

const CX = 2759.1;
const CY = 2759.1;
const FILL = "#1a1a1a";
const VIEWBOX = "0 0 5519 5519";

// Short / long tip ratio (~2232 / ~2759) — raggi si incontrano a metà animazione
const SHORT_SCALE = 2232 / 2759;
const LONG_SCALE_MIN = SHORT_SCALE;
const SHORT_SCALE_MAX = 1 / SHORT_SCALE;

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

function triPath(tip, inner) {
  return `M${fmt(CX)},${fmt(CY)} L${fmt(tip[0])},${fmt(tip[1])} L${fmt(inner[0])},${fmt(inner[1])} Z`;
}

const points = parsePath(PATH_D);
const vertexCount = Math.floor(points.length / 4) * 4;
const unique = points.slice(0, vertexCount);

const rays = [];
for (let i = 0; i < unique.length; i += 4) {
  const longTip = unique[i];
  const longInner = unique[i + 1];
  const shortTip = unique[i + 2];
  const shortInner = unique[i + 3];
  rays.push({ kind: "long", d: triPath(longTip, longInner) });
  rays.push({ kind: "short", d: triPath(shortTip, shortInner) });
}

console.log(`Rays: ${rays.length} (${rays.filter((r) => r.kind === "long").length} long, ${rays.filter((r) => r.kind === "short").length} short)`);

const paths = rays.map(
  (r) => `    <path class="ray ray-${r.kind}" d="${r.d}" fill="${FILL}"/>`
);

const cssVars = `  --sun-cx: ${CX}px;
  --sun-cy: ${CY}px;
  --ray-long-min: ${LONG_SCALE_MIN.toFixed(4)};
  --ray-short-rest: ${SHORT_SCALE.toFixed(4)};
  --ray-short-max: ${SHORT_SCALE_MAX.toFixed(4)};`;

const svg = `<svg viewBox="${VIEWBOX}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="logo-annamori-svg">
  <style>
    :root {
${cssVars.split("\n").join("\n")}
    }
  </style>
  <g id="sun" class="sun-rotate">
${paths.join("\n")}
  </g>
</svg>
`;

const root = path.join(__dirname, "..");
fs.writeFileSync(path.join(root, "logoannamori-animated.svg"), svg, "utf8");

// Export scale constants for CSS file
fs.writeFileSync(
  path.join(root, "scripts", "scale-constants.json"),
  JSON.stringify({ CX, CY, SHORT_SCALE, LONG_SCALE_MIN, SHORT_SCALE_MAX }, null, 2),
  "utf8"
);

console.log("Done.");
console.log(`Scale: short rest=${SHORT_SCALE.toFixed(4)}, long min=${LONG_SCALE_MIN.toFixed(4)}, short max=${SHORT_SCALE_MAX.toFixed(4)}`);
