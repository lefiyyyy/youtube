# STREAMER RISE

A polished 3D creator life simulator for the browser (Three.js). Start as an unknown creator in a tiny bedroom
and grow into an elite online personality: record and edit videos, stream live with a real-time chat, post on
social platforms, sign brand deals, upgrade your gear and room, and keep your character fed and rested.

![genre](https://img.shields.io/badge/genre-life%20sim-ff4f8b) ![engine](https://img.shields.io/badge/engine-Three.js%20r170-2fd6ff) ![deps](https://img.shields.io/badge/runtime%20deps-none-9dff5a)

## Run it

```bash
node server.js          # http://localhost:8080
# or
npm start
```

Requirements: Node 16+ (only for the tiny static server) and a WebGL2-capable browser.
There is **no build step and no install**: every critical asset (Three.js, fonts, code) is local in `public/`.
Audio is synthesized at runtime with WebAudio, and all 3D models and textures are procedural.

Any static host works too — just serve the `public/` folder (e.g. upload it as the game folder on CrazyGames).

### Useful URL flags

| Flag | Effect |
| --- | --- |
| `?fresh` | Wipe the local save and start a brand-new career |
| `?q=low\|medium\|high` | Force a graphics preset for this session |
| `?dayOffset=N` | Pretend it is N days later (tests daily rewards / events) |
| `?cgsdk` | Force-load the CrazyGames SDK outside crazygames.com |
| `?crazygames_sandbox=1` | Load the SDK in sandbox mode (test ads) |

## How to play

* **Create your creator**: boy or girl, skin, hair, signature color and outfit (tops, bottoms, shoes, headwear,
  eyewear, jewelry). Change it any time at the **mirror** (wardrobe).
* **Your room** is a real interior (four walls, ceiling, daylight through the windows). Click / tap objects:
  desk (create), fridge & counter (kitchen), bed (rest), mirror (wardrobe), door, the cat. Click the floor to walk.
  Drag to look around, scroll / pinch to zoom.
* **CREATE** opens the creation hub:
  * **Record Video** — pick a game and a video type. Your creator records it on their own; tap the highlights that
    pop up (Clutch!, Epic!, LOL…) to capture the best moments. Then choose how to edit — **Quick Cut**, **Clean
    Edit** or **Pro Edit** (more hours & energy, better quality) — and watch the edit happen automatically.
    Pick a thumbnail, a title (Clickbait / Honest / Trendy) and up to 3 **tags** (the trending tag only helps if it
    fits the game), then publish.
  * **Premiere** — the upload goes live in front of you: views, likes/dislikes, comments, subscribers and revenue
    arrive **in real time** on a live chart (no skipping, no fake fast-forward). Continue whenever you like: every
    video keeps earning on the wall clock — a first wave from your subscribers in the first couple of minutes, then a
    discovery tail over the next hour — while you do other things, sleep in-game, or even close the game. Watch the
    **subscriber counter** (+N/min), the **latest upload** widget (views ticking up, +N views/min) and per-video
    live stats in the **Creator Studio**.
  * **Go Live** — stream on Pulse: talk to chat, land Big Plays, clip moments, run polls and giveaways, thank
    donations, ban trolls, welcome raids and ride the hype train. The chat is modelled on real streams: the number of
    active chatters grows sub-linearly with viewers and each chatter writes a couple of messages a minute, so a
    5-viewer stream gets the odd message from the same few regulars while a 5,000-viewer stream scrolls fast.
    Donations, subs, trolls, polls and hype trains scale with the audience too.
  * **Post Social** — Blip and (level 8+) Lumo posts; Fit Check posts scale with your **style score**.
* **Shop** — every item has a live 3D preview before you buy it:
  * **Setup**: PC, monitor, camera, microphone, lighting, chair, desk, keyboard & mouse, internet. Buy any unlocked
    tier (side-by-side stat comparison with what you have installed); it's installed and visible in your room.
  * **Decor** (room vibe), **Fashion** (real brands, tried on your own character: Carhartt WIP, Nike, Stüssy, Ralph
    Lauren, Arc'teryx, Stone Island, Off-White, Moncler, Balenciaga, Rick Owens, Chrome Hearts), **Games** (34 games
    across 13 genres), **Room** styles and **Homes**.
* **Go Out**:
  * **Rooftop Party** (8 PM – 2 AM): walk up to famous creators, chat about topics they love (or hate), compliment
    their fit, take selfies (Blip followers) and earn hearts. Friends (3 hearts) accept **collab** pitches — free
    Collab videos with them, no follower requirement.
  * **Fan Meetup** (1,000+ subscribers): give each fan what they ask for — autograph, selfie, hug or high five.
  * **Café Shift**: part-time barista minigame for quick cash early on.
  * **Creator Academy**: Gaming, Editing, Charisma and Business skills (+2 points per level up, or paid courses).
  * **Mall**: jumps to the fashion shop.
* **Needs**: hunger and energy drain as you work. Low needs lower your content quality — eat in the kitchen
  (or order delivery), nap, or sleep to start a new day.
* **Strategy**: trending genres change every in-game day, events boost specific genres, audiences get bored of
  the same game, evening uploads perform better, platforms feed each other (Vidora → Pulse → Blip → Lumo).

Keyboard: `Space` hits the Big Play ring while streaming; `1–5` trigger stream actions; `Esc` closes panels.

## Progression & retention systems

* **Player level** (40 levels, career titles) unlocks content types, games, gear tiers, decor, foods, homes and
  features (partner program, polls, brand deals, raids, giveaways, collabs, creator team, Lumo, advanced analytics).
* **Daily rewards**: 7-day calendar with exclusive decor, boosts, overlays and a Golden Week box on day 7.
* **Daily quests**: 3–4 short goals per real day plus a completion chest.
* **Live events** rotate every real day (weekends get Stream Rush / Double Followers): tasks earn event points
  that unlock a 5-tier reward track (exclusive decor, outfits, badges, titles, themes, games). The next event is
  always visible as **LOCKED · STARTS TOMORROW** with its rewards, and a teaser appears after great sessions.
* **Milestones**: subscriber plaques (1K, 10K, 100K, 1M, 10M) appear on your wall.
* **Homes**: Tiny Bedroom → City Apartment → Creator Loft → Skyline Penthouse.
* **Late game**: collabs with NPC creators, brand deals, team hires (editor, moderator, manager), trend cycles,
  community mood (fan inbox), mega productions and creator awards.
* **Skills & friends**: four creator skills (10 levels each) and relationships with nine NPC influencers.

Saves are automatic (localStorage, plus the CrazyGames data module for cross-device saves when available; the
newer of the two wins). Returning players get a "While you were away" summary of the views, subscribers and revenue
their videos earned in real time while the game was closed.

## Project layout

```
server.js                 zero-dependency static server
public/
  index.html              shell + import map (three → local vendor build)
  css/style.css           UI design system
  fonts/                  Bricolage Grotesque, Outfit, Caveat (OFL)
  vendor/three/           Three.js r170 + used addons (MIT)
  js/
    main.js               bootstrap & main loop
    core/                 state & saving, event bus, utilities
    data/                 games, content types, gear, decor, food, events, quests, rewards, chat, sponsors
    world/                renderer & camera director, room builder, furniture/gear models, character rig &
                          clothing, animated monitor screens, skyline, particles, navigation, party/meetup venues,
                          shop item preview renderer
    game/                 economy formulas, live video performance (real-time views), core controller, tutorial
    flows/                create/video, live stream, social phone, life (kitchen/sleep), shop, meta systems,
                          character creator & wardrobe, going out (party, meetup, café job, academy), thumbnails
    ui/                   icon set & UI framework (HUD, modals, toasts, reward fly-ins)
    audio/                procedural SFX + generative lo-fi / synthwave music
tools/                    dev tooling: Playwright playthroughs, screenshots, balance simulator
```

## CrazyGames

The game is ready for **Basic Launch** and already wired for Full Launch (`public/js/sdk.js`):

* The SDK v3 script is loaded only when the game runs on CrazyGames (host, embedding page or `?cgsdk`), before the
  save is read, with timeouts so a blocked script can never hang the loading screen. Elsewhere the game runs offline.
* `loadingStart` / `loadingStop` around boot; `gameplayStart` once the intro ends and `gameplayStop` /
  `gameplayStart` (kept balanced) when the tab is hidden, the settings menu is open and during ads.
* **Midgame ads** only at natural breaks — after a premiere, after a stream summary, after a night's sleep — never
  during the tutorial, never in the first 2.5 minutes, at most every 3 minutes (the SDK applies its own limits on
  top). While an ad plays the game is frozen and muted; it resumes on `adFinished` or `adError`.
* `happytime` on level-ups, milestones and viral videos; the platform **mute** setting is respected live.
* **Data module**: the save is mirrored (throttled, flushed when the tab is hidden) so logged-in players keep their
  progress across devices.
* Embedding hygiene: no page scrolling with Space / arrow keys, no browser context menu, no external links, no
  network requests besides the SDK. 2 MB total, ~80 files, all assets local.

`node tools/sdktest.mjs` runs the integration against a mock of the SDK and checks the call order, ad pause/mute,
cooldown, platform mute and data saves.

**Store videos** (no cover image needed, the existing one is used): `node tools/trailer.mjs landscape` and
`node tools/trailer.mjs portrait` capture real gameplay frame by frame on a fake clock (true game speed, no
speed-up, no cursor, no black frames or text cards) and encode `tools/video/streamer-rise-landscape.mp4`
(1920×1080) and `tools/video/streamer-rise-portrait.mp4` (1080×1620, 2:3).

## Development tools

`tools/` contains the scripts used to QA and balance the game (they use Playwright, not required to play):

* `node tools/play.mjs [w] [h] [mobile]` — scripted tutorial playthrough with screenshots and console-error capture.
* `node tools/play2.mjs` — mid-game flows (streams, sleep, decor, themes, homes, level-ups, deals, wardrobe).
* `node tools/play3.mjs` — returning player: offline views, daily reward streak, next-day event + reminder (`?dayOffset`).
* `node tools/play4.mjs` — late game: collab videos, Lumo, inbox, delivery, team, poll/giveaway, penthouse.
* `node tools/sdktest.mjs` — CrazyGames SDK integration checks (mock SDK).
* `node tools/trailer.mjs landscape|portrait` — store gameplay videos (needs `ffmpeg`).
* `node tools/look.mjs 13 21` — high-quality room screenshots at the given in-game hours.
* `node tools/sim.mjs [runs] ['{"RV":2.0}']` — economy pacing simulator (prints level / fans / money over real minutes).
* `node tools/check.mjs` — syntax-checks every ES module.
* `node tools/steps.mjs steps.json [w] [h] [outDir]` — runs a JSON list of browser steps (url / click / eval / waitFor / shot).
* `node tools/build-artifact.mjs public <outDir>` — packages the game as a single page for a Claude Artifact (inline CSS, Three.js from jsDelivr, fonts from Google Fonts, game modules as supporting files).

Tools expect the server on `http://localhost:8080` (`node server.js 8080`) and Playwright's Chromium
(`npm i playwright` in `tools/` if needed).

Target pacing from the simulator: first 100 subscribers in ~5 minutes, 1K (Bronze plaque) in ~25 minutes,
10K in ~70 minutes, 100K in ~3 hours and 1M after roughly 6–7 hours of play.

## Credits & licenses

* Three.js — MIT (`public/vendor/three/LICENSE`)
* Bricolage Grotesque, Outfit, Caveat — SIL Open Font License (`public/fonts/OFL-*.txt`)
* All game code, models, textures, icons, music and sound effects are original and generated procedurally.
* Platforms, sponsor brands, games and creators in the game are fictional. Fashion items carry the names of real
  clothing brands for flavour only; the game is not affiliated with or endorsed by them, no logos are reproduced,
  and all brand names live in `public/js/data/clothes.js` so they can be swapped before distribution if required.
