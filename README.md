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

## How to play

* **Click / tap objects in your room**: desk (create), fridge & counter (kitchen), bed (rest), mirror (style),
  door (homes & delivery), the cat. Click the floor to walk. Drag to look around, scroll / pinch to zoom.
* **CREATE** opens the creation hub:
  * **Record Video** — pick a game and a video type, then play the *capture* rhythm minigame (tap when the
    highlight hits the ring — gold = clutch, red = fail, except in Funny Highlights where bloopers count),
    cut boring clips in the *edit* minigame, choose a thumbnail and title (Clickbait / Honest / Trendy) and publish.
  * **Go Live** — stream on Pulse: talk to chat, land Big Plays (timing ring), clip moments, run polls and
    giveaways, thank donations, ban trolls, welcome raids and ride the hype train.
  * **Post Social** — Blip (updates, selfies, stream announcements, clips, hot takes, sponsored posts) and,
    from level 8, Lumo (setup tours, fit checks, food pics, behind the scenes).
* **Needs**: hunger and energy drain as you work. Low needs lower your content quality — eat in the kitchen
  (or order delivery), nap, or sleep to start a new day (your videos keep earning views overnight).
* **Shop**: gear upgrades (PC, monitors, camera, mic, lighting, chair, desk, peripherals, internet) are all visibly
  modelled in the room and raise your setup score. Decor raises Room Vibe. Buy games, room styles and homes.
* **Strategy**: trending genres change every in-game day, events boost specific genres, audiences get bored of
  the same game, evening uploads perform better, platforms feed each other (Vidora → Pulse → Blip → Lumo).

Keyboard: `Space` hits moments while recording / Big Play ring; `1–5` trigger stream actions.

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

Saves are automatic (localStorage, mirrored to the CrazyGames data module when available). Returning players
receive the views their videos earned while they were away.

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
                          animation, animated monitor screens, skyline, particles, navigation
    game/                 economy formulas, core game controller, tutorial
    flows/                create/video, live stream, social phone, life (kitchen/sleep), shop, meta systems,
                          character creator, thumbnails
    ui/                   icon set & UI framework (HUD, modals, toasts, reward fly-ins)
    audio/                procedural SFX + generative lo-fi / synthwave music
tools/                    dev tooling: Playwright playthroughs, screenshots, balance simulator
```

## Development tools

`tools/` contains the scripts used to QA and balance the game (they use Playwright, not required to play):

* `node tools/play.mjs [w] [h] [mobile]` — scripted tutorial playthrough with screenshots and console-error capture.
* `node tools/play2.mjs` — mid-game flows (streams, sleep, decor, themes, homes, level-ups, deals, wardrobe).
* `node tools/sim.mjs [runs] ['{"RV":2.0}']` — economy pacing simulator (prints level / fans / money over real minutes).
* `node tools/check.mjs` — syntax-checks every ES module.

## Credits & licenses

* Three.js — MIT (`public/vendor/three/LICENSE`)
* Bricolage Grotesque, Outfit, Caveat — SIL Open Font License (`public/fonts/OFL-*.txt`)
* All game code, models, textures, icons, music and sound effects are original and generated procedurally.
* Platforms, brands, games and creators in the game are fictional.
