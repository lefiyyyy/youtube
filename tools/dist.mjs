// Builds dist/ — everything that gets uploaded to CrazyGames:
//   dist/streamer-rise-crazygames.zip   the game (index.html at the zip root) — upload this as the game files
//   dist/game/                          the same files unzipped, to test locally: node server.js 8080 dist/game
//   dist/videos/*.mp4                   store videos (made by tools/trailer.mjs, landscape 1920x1080 + portrait 1080x1620)
//   dist/UPLOAD.md                      upload steps + store listing text
// Usage: node tools/dist.mjs
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const DIST = 'dist', GAME = join(DIST, 'game'), ZIP = join(DIST, 'streamer-rise-crazygames.zip');
rmSync(GAME, { recursive: true, force: true });
rmSync(ZIP, { force: true });
mkdirSync(GAME, { recursive: true });
cpSync('public', GAME, { recursive: true, filter: (src) => !/(^|\/)\.DS_Store$/.test(src) });

// sanity: syntax-check every module
execFileSync('node', ['tools/check.mjs'], { stdio: 'inherit' });

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
