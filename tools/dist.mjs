// Builds dist/ — everything that gets uploaded to CrazyGames:
//   dist/streamer-rise-crazygames.zip   the game (index.html at the zip root) — upload this as the game files
//   dist/game/                          the same files unzipped, to test locally: node server.js 8080 dist/game
//   dist/videos/*.mp4                   store videos (made by tools/trailer.mjs, landscape 1920x1080 + portrait 1080x1620)
//   dist/UPLOAD.md                      upload steps + store listing text
// Usage: node tools/dist.mjs
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, relative, dirname, sep } from 'path';

const DIST = 'dist', GAME = join(DIST, 'game'), ZIP = join(DIST, 'streamer-rise-crazygames.zip');
rmSync(GAME, { recursive: true, force: true });
rmSync(ZIP, { force: true });
mkdirSync(GAME, { recursive: true });
cpSync('public', GAME, { recursive: true, filter: (src) => !/(^|\/)\.DS_Store$/.test(src) });

// sanity: syntax-check every module
execFileSync('node', ['tools/check.mjs'], { stdio: 'inherit' });

// Browser compatibility: import maps need Safari 16.4+ / Firefox 108+, so the shipped build resolves the 'three'
// bare import to a relative path in every module and drops the import map (works on iOS 15+, any modern browser).
const walkJs = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walkJs(p) : p.endsWith('.js') ? [p] : []; });
const THREE_FILE = join(GAME, 'vendor/three/three.module.min.js');
let rewired = 0;
for (const f of walkJs(GAME)) {
  const src = readFileSync(f, 'utf8');
  if (!src.includes("from 'three'")) continue;
  let rel = relative(dirname(f), THREE_FILE).split(sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  writeFileSync(f, src.split("from 'three'").join(`from '${rel}'`));
  rewired++;
}
// …and preloads every module in parallel instead of discovering them import by import (faster first load).
const html = join(GAME, 'index.html');
const mods = walkJs(join(GAME, 'js')).map((f) => relative(GAME, f).split(sep).join('/')).sort();
const preload = ['vendor/three/three.module.min.js', ...mods].map((m) => `<link rel="modulepreload" href="${m}">`).join('\n');
let page = readFileSync(html, 'utf8').replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, '');
page = page.replace('</head>', `${preload}\n</head>`);
writeFileSync(html, page);
const left = walkJs(GAME).filter((f) => /from 'three'/.test(readFileSync(f, 'utf8')));
if (left.length || page.includes('importmap')) throw new Error('bare three imports left: ' + left.join(', '));
console.log(`compat: ${rewired} modules import three by relative path, no import map, ${mods.length + 1} modulepreloads`);

execFileSync('zip', ['-q', '-r', '-X', '-9', '../streamer-rise-crazygames.zip', '.'], { cwd: GAME });

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(GAME);
const bytes = files.reduce((a, f) => a + statSync(f).size, 0);
const mb = (n) => (n / 1e6).toFixed(1) + ' MB';
console.log(`game: ${files.length} files, ${mb(bytes)} (limits: 1500 files, 250 MB total, 50 MB initial download)`);
console.log(`zip:  ${ZIP} ${mb(statSync(ZIP).size)}`);
for (const v of ['streamer-rise-landscape.mp4', 'streamer-rise-portrait.mp4']) {
  const p = join(DIST, 'videos', v);
  console.log(existsSync(p) ? `video: ${p} ${mb(statSync(p).size)}` : `video MISSING: ${p} (run node tools/trailer.mjs)`);
}
