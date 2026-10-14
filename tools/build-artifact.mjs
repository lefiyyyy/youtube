// Packages public/ into an Artifact-ready folder: page with inline CSS, Google Fonts,
// Three.js r170 from jsDelivr, and the game's own ES modules as supporting files.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'fs';
import { join, dirname, relative } from 'path';
const [,, SRC, OUT] = process.argv;
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
walk(join(SRC, 'js'));
for (const f of files) {
  let s = readFileSync(f, 'utf8');
  s = s.replaceAll("'../../vendor/three/addons/", `'${CDN}examples/jsm/`);
  s = s.replace(/"Bricolage"/g, '"Bricolage Grotesque"').replace(/\bBricolage,/g, '"Bricolage Grotesque",');
  const out = join(OUT, relative(SRC, f));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, s);
}
if (readFileSync(join(OUT, 'js/world/world.js'), 'utf8').includes('vendor/')) throw new Error('vendor path left');
// CSS: drop local @font-face, rename display family, single dark look
let css = readFileSync(join(SRC, 'css/style.css'), 'utf8');
css = css.replace(/@font-face\s*\{[^}]*\}\s*/g, '').replace(/'Bricolage'/g, "'Bricolage Grotesque'");
css = css.replace(':root {', ':root {\n  color-scheme: dark;');
const html = readFileSync(join(SRC, 'index.html'), 'utf8');
const body = html.slice(html.indexOf('<div id="app">'), html.indexOf('<script type="module"'));
const page = `<title>Streamer Rise</title>
<meta name="description" content="Build your creator career from a tiny bedroom setup to an elite studio. Record, stream, post, upgrade and go viral.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Caveat:wght@700&family=Outfit:wght@400;500;600;700;800&display=swap">
<style>
${css}
</style>
<script type="importmap">{ "imports": { "three": "${CDN}build/three.module.min.js" } }</script>
${body}<script type="module" src="js/main.js"></script>
`;
writeFileSync(join(OUT, 'streamer-rise.html'), page);
console.log('page bytes', page.length, 'modules', files.length);
