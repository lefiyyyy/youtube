# Streamer Rise – CrazyGames feltöltés

Minden, amit fel kell tölteni, ebben a mappában van. Borítóképet nem tettem ide, az már megvan neked.

| Fájl | Mire kell |
| --- | --- |
| `streamer-rise-crazygames.zip` | **A játék.** Ezt töltsd fel játékfájlként (az `index.html` a zip gyökerében van). |
| `videos/streamer-rise-landscape.mp4` | Landscape gameplay videó, 1920×1080, ~18 mp |
| `videos/streamer-rise-portrait.mp4` | Portrait gameplay videó, 1080×1620 (2:3), ~18 mp |
| `game/` | Ugyanaz, mint a zip, kicsomagolva (helyi teszthez: `node server.js 8080 dist/game`) |

## Lépések a CrazyGames Developer Portalon

1. Új játék beküldése → játékfájlok: töltsd fel a `streamer-rise-crazygames.zip`-et.
2. Eszközök: **Desktop + Mobile**. Tájolás: **landscape** (álló telefonon a játék kéri, hogy fordítsd el).
3. SDK: a CrazyGames SDK v3 be van építve. Basic Launch-hoz minden kész. A Full Launch reklámjai (midgame) is be vannak kötve, csak természetes szünetekben futnak.
4. Videók: a landscape és a portrait mp4 a `videos/` mappából.
5. Borítókép: a sajátod.
6. Szövegek: másold be az angol szövegeket lent.
7. Beküldés előtt nyisd meg a portál előnézetében, és nézd meg, hogy:
   - betölt, és indul a játék;
   - a platform némítás működik;
   - desktopon és telefonon is végig lehet menni a tutorialon.

## Store szöveg (angol, ezt kell bemásolni)

**Title:** Streamer Rise

**Short description:**
Grow from a tiny bedroom setup into a superstar creator: record, stream, go viral and live the creator life.

**Description:**
Start with a hand-me-down laptop in a tiny bedroom and build your way up to a skyline penthouse studio.

Record gameplay and catch the highlights, pick an edit, thumbnail, title and tags, then watch your premiere
roll in live – views, likes, comments and subscribers arrive in real time, and if you're lucky, it goes viral.
Go live on stream: land big plays, clip moments, run polls and giveaways, welcome raids and ride the hype train
while chat floods with W's. Post on social media, sign brand deals, upgrade your PC, camera, mic and lights,
decorate your room, dress up in streetwear, and hit the rooftop party to befriend famous creators and unlock collabs.

Keep your creator fed and rested, follow the daily trends, complete quests and events, and unbox your
subscriber plaques: 1K, 10K, 100K, 1M and beyond.

**Controls:**
- Mouse or touch: tap objects in the room (desk, kitchen, bed, mirror, door) or use the bottom menu
- Drag to look around, scroll or pinch to zoom
- Streaming: 1–5 for stream actions, Space to hit the Big Play ring
- Esc closes panels

**Tags (suggestion):** simulation, life simulation, tycoon, streamer, youtuber, 3d, casual, dress up, management

**Category (suggestion):** Simulation

## Jó tudni

- Mentés: a böngészőbe, és bejelentkezett játékosoknál a CrazyGames felhőjébe is, így eszközök között is megmarad.
- A ruhaboltban valódi márkanevek vannak (pl. Chrome Hearts, Rick Owens). Ha a review kifogásolja, mind egy fájlban van
  (`public/js/data/clothes.js`), gyorsan lecserélhetők. Utána futtasd újra: `node tools/dist.mjs`.
- Ha bármit módosítasz a játékon, a `node tools/dist.mjs` újra legyártja a zipet és ezt a mappát.
