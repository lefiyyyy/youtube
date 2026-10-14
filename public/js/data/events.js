// Live events. A schedule maps each real-world day to an event; weekends get stream-centric events.
const scale = (lvl, base) => Math.max(base, Math.round((base * Math.pow(Math.max(1, lvl), 1.25)) / 10) * 10);

export const EVENTS = {
  retro: {
    name: 'Retro Game Festival', short: 'Retro Fest', tagline: 'Pixels are back in style',
    colors: ['#38d6f5', '#ff3df2'], icon: 'pixel', art: 'pixel',
    fx: { genre: 'retro', genreMult: 1.6, sale: { tag: 'retro', pct: 30 } },
    tasks: (l) => [
      { id: 'v', text: 'Upload 2 Retro videos', evt: 'video', tag: 'retro', target: 2, pts: 40 },
      { id: 's', text: 'Stream a Retro game', evt: 'stream', tag: 'retro', target: 1, pts: 35 },
      { id: 'f', text: `Gain ${scale(l, 120)} followers`, evt: 'fans', target: scale(l, 120), pts: 35 },
      { id: 'p', text: 'Post 3 times', evt: 'post', target: 3, pts: 25 },
      { id: 'q', text: 'Hit 15 PERFECTs', evt: 'perfect', target: 15, pts: 15 },
    ],
    rewards: [
      { pts: 25, kind: 'cosmetic', item: 'badge_retro' },
      { pts: 55, kind: 'game', item: 'arcadeclassics' },
      { pts: 85, kind: 'cosmetic', item: 'crt_cam' },
      { pts: 115, kind: 'cosmetic', item: 'title_pixel' },
      { pts: 145, kind: 'decor', item: 'pixel_cabinet' },
    ],
  },
  horror: {
    name: 'Horror Week', short: 'Horror Week', tagline: 'Scream for the algorithm',
    colors: ['#ff5470', '#9b5cff'], icon: 'ghost', art: 'ghost',
    fx: { genre: 'horror', genreMult: 1.7, sale: { tag: 'horror', pct: 30 } },
    tasks: (l) => [
      { id: 'v', text: 'Upload 2 Horror videos', evt: 'video', tag: 'horror', target: 2, pts: 40 },
      { id: 's', text: 'Stream a Horror game', evt: 'stream', tag: 'horror', target: 1, pts: 35 },
      { id: 'f', text: `Gain ${scale(l, 120)} followers`, evt: 'fans', target: scale(l, 120), pts: 35 },
      { id: 'c', text: 'Clip 2 stream moments', evt: 'clip', target: 2, pts: 20 },
      { id: 'e', text: 'Eat 2 meals', evt: 'eat', target: 2, pts: 15 },
    ],
    rewards: [
      { pts: 25, kind: 'cosmetic', item: 'badge_horror' },
      { pts: 55, kind: 'decor', item: 'pumpkin_lamp' },
      { pts: 85, kind: 'cosmetic', item: 'hoodie_ghost' },
      { pts: 115, kind: 'cosmetic', item: 'title_night' },
      { pts: 145, kind: 'theme', item: 'spooky' },
    ],
  },
  rush: {
    name: 'Weekend Stream Rush', short: 'Stream Rush', tagline: 'Live hours pay double',
    colors: ['#ffb547', '#ff4f6e'], icon: 'live', art: 'live',
    fx: { streamMult: 1.5 },
    tasks: (l) => [
      { id: 's', text: 'Go live 3 times', evt: 'stream', target: 3, pts: 45 },
      { id: 'pk', text: `Reach ${scale(l, 25)} viewers`, evt: 'peak', target: scale(l, 25), max: true, pts: 35 },
      { id: 't', text: 'Thank 5 donations', evt: 'thank', target: 5, pts: 30 },
      { id: 'a', text: 'Announce a stream', evt: 'announce', target: 1, pts: 20 },
      { id: 'c', text: 'Clip 3 moments', evt: 'clip', target: 3, pts: 20 },
    ],
    rewards: [
      { pts: 25, kind: 'cosmetic', item: 'badge_rush' },
      { pts: 55, kind: 'cosmetic', item: 'overlay_rush' },
      { pts: 85, kind: 'sparks', amount: 40 },
      { pts: 115, kind: 'cosmetic', item: 'title_rush' },
      { pts: 145, kind: 'decor', item: 'onair_sign' },
    ],
  },
  double: {
    name: 'Double Followers Weekend', short: '2x Followers', tagline: 'Every new fan counts twice',
    colors: ['#9dff5a', '#2fd6ff'], icon: 'users', art: 'double',
    fx: { followMult: 2 },
    tasks: (l) => [
      { id: 'f', text: `Gain ${scale(l, 250)} followers`, evt: 'fans', target: scale(l, 250), pts: 45 },
      { id: 'v', text: 'Upload 3 videos', evt: 'video', target: 3, pts: 35 },
      { id: 's', text: 'Go live twice', evt: 'stream', target: 2, pts: 35 },
      { id: 'p', text: 'Post 4 times', evt: 'post', target: 4, pts: 25 },
    ],
    rewards: [
      { pts: 25, kind: 'sparks', amount: 20 },
      { pts: 55, kind: 'buff', buff: 'xp2', uses: 5 },
      { pts: 85, kind: 'cosmetic', item: 'overlay_holo' },
      { pts: 115, kind: 'buff', buff: 'trend', uses: 2 },
      { pts: 140, kind: 'decor', item: 'onair_sign' },
    ],
  },
  awards: {
    name: 'Creator Awards', short: 'Awards', tagline: 'Nominated: you',
    colors: ['#ffcf4a', '#ff8a3d'], icon: 'trophy', art: 'trophy',
    fx: { viewMult: 1.2 },
    tasks: (l) => [
      { id: 'v', text: 'Upload 3 videos', evt: 'video', target: 3, pts: 40 },
      { id: 'pf', text: 'Score a 90%+ video', evt: 'great', target: 1, pts: 35 },
      { id: 'f', text: `Gain ${scale(l, 200)} followers`, evt: 'fans', target: scale(l, 200), pts: 35 },
      { id: 'u', text: 'Buy 2 upgrades', evt: 'buy', target: 2, pts: 25 },
    ],
    rewards: [
      { pts: 25, kind: 'cosmetic', item: 'badge_awards' },
      { pts: 55, kind: 'sparks', amount: 30 },
      { pts: 85, kind: 'buff', buff: 'trend', uses: 2 },
      { pts: 115, kind: 'cosmetic', item: 'title_icon' },
      { pts: 135, kind: 'decor', item: 'trophy_case' },
    ],
  },
  sponsor: {
    name: 'Sponsor Season', short: 'Sponsor Season', tagline: 'Brands are paying double',
    colors: ['#4fd37b', '#2fd6ff'], icon: 'handshake', art: 'deal',
    fx: { dealMult: 2, moneyMult: 1.25 },
    tasks: (l) => [
      { id: 'e', text: `Earn $${scale(l, 300)}`, evt: 'earn', target: scale(l, 300), pts: 40 },
      { id: 'v', text: 'Upload 2 videos', evt: 'video', target: 2, pts: 35 },
      { id: 'd', text: 'Complete a deal or post', evt: 'post', target: 2, pts: 30 },
      { id: 's', text: 'Go live once', evt: 'stream', target: 1, pts: 30 },
    ],
    rewards: [
      { pts: 25, kind: 'cosmetic', item: 'badge_sponsor' },
      { pts: 55, kind: 'money', amount: 0 },
      { pts: 85, kind: 'sparks', amount: 30 },
      { pts: 115, kind: 'cosmetic', item: 'title_deal' },
      { pts: 135, kind: 'decor', item: 'gold_plant' },
    ],
  },
  collab: {
    name: 'Collab Fest', short: 'Collab Fest', tagline: 'Better together',
    colors: ['#b48cff', '#ff4f8b'], icon: 'handshake', art: 'collab',
    fx: { collabMult: 1.5, followMult: 1.25 },
    tasks: (l) => [
      { id: 'v', text: 'Upload 2 videos', evt: 'video', target: 2, pts: 35 },
      { id: 's', text: 'Go live once', evt: 'stream', target: 1, pts: 35 },
      { id: 'p', text: 'Post 3 times', evt: 'post', target: 3, pts: 30 },
      { id: 'f', text: `Gain ${scale(l, 150)} followers`, evt: 'fans', target: scale(l, 150), pts: 35 },
    ],
    rewards: [
      { pts: 25, kind: 'cosmetic', item: 'badge_collab' },
      { pts: 55, kind: 'sparks', amount: 25 },
      { pts: 85, kind: 'cosmetic', item: 'overlay_neon' },
      { pts: 115, kind: 'cosmetic', item: 'title_collab' },
      { pts: 135, kind: 'decor', item: 'disco_ball' },
    ],
  },
  speed: {
    name: 'Speedrun Showdown', short: 'Speedrun', tagline: 'Faster. Harder. Clips.',
    colors: ['#ff7a45', '#ffe066'], icon: 'mountain', art: 'speed',
    fx: { genre: 'challenge', genreMult: 1.6, sale: { tag: 'challenge', pct: 25 } },
    tasks: (l) => [
      { id: 'v', text: 'Upload 2 Challenge videos', evt: 'video', tag: 'challenge', target: 2, pts: 40 },
      { id: 'q', text: 'Hit 20 PERFECTs', evt: 'perfect', target: 20, pts: 30 },
      { id: 's', text: 'Go live once', evt: 'stream', target: 1, pts: 35 },
      { id: 'f', text: `Gain ${scale(l, 120)} followers`, evt: 'fans', target: scale(l, 120), pts: 30 },
    ],
    rewards: [
      { pts: 25, kind: 'sparks', amount: 15 },
      { pts: 55, kind: 'cosmetic', item: 'jacket_pixel' },
      { pts: 85, kind: 'buff', buff: 'xp2', uses: 4 },
      { pts: 115, kind: 'sparks', amount: 35 },
      { pts: 135, kind: 'decor', item: 'crt_tv' },
    ],
  },
};

const WEEKDAY_ROTATION = ['retro', 'horror', 'sponsor', 'speed', 'awards', 'collab'];
// Returns {id, key, start, end} for the event running on a given real-world day index.
export function eventForDay(dayIdx) {
  const dow = new Date(dayIdx * 86400000).getUTCDay(); // 0 Sun .. 6 Sat
  const week = Math.floor((dayIdx + 3) / 7);
  if (dow === 6 || dow === 0) {
    const id = week % 2 === 0 ? 'rush' : 'double';
    const sat = dow === 6 ? dayIdx : dayIdx - 1;
    return { id, key: `${id}-${sat}`, startDay: sat, endDay: sat + 2 };
  }
  const id = WEEKDAY_ROTATION[(dayIdx + week) % WEEKDAY_ROTATION.length];
  return { id, key: `${id}-${dayIdx}`, startDay: dayIdx, endDay: dayIdx + 1 };
}
