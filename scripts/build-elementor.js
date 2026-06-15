/** Build self-contained Elementor HTML snippet. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "logo-annamori.css"), "utf8");
let svg = fs.readFileSync(path.join(root, "logoannamori-animated.svg"), "utf8");

// Remove duplicate :root block from SVG (CSS lives in wrapper)
svg = svg.replace(/<style>[\s\S]*?<\/style>\s*/i, "");

const scopedCss = css
  .replace(/:root\s*\{/g, ".logo-annamori-wrap {")
  .replace(/\.logo-annamori svg,/g, ".logo-annamori-wrap svg,")
  .replace(/\.logo-annamori\s*\{/g, ".logo-annamori-wrap.logo-annamori {");

const html = `<!-- Logo Annamori animato — incolla in Elementor > Widget HTML -->
<div class="logo-annamori-wrap logo-annamori">
<style>
${scopedCss}
.logo-annamori-wrap.logo-annamori svg {
  width: 120px;
  height: auto;
}
</style>
${svg.trim()}
</div>
`;

fs.writeFileSync(path.join(root, "elementor-snippet.html"), html, "utf8");
console.log("Written elementor-snippet.html");
