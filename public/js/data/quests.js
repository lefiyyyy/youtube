// Daily quest templates. target scales with level via fn.
export const QUEST_POOL = [
  { id: 'upload',     icon: 'upload',   text: (n) => `Upload ${n} videos`,         evt: 'video',     target: (l) => (l < 4 ? 2 : 3), r: { money: 1, xp: 1 } },
  { id: 'live',       icon: 'live',     text: (n) => n > 1 ? `Go live ${n} times` : 'Go live once', evt: 'stream', target: (l) => (l < 6 ? 1 : 2), r: { money: 1, xp: 1.2 } },
  { id: 'post',       icon: 'blip',     text: (n) => `Post ${n} times on social`,  evt: 'post',      target: () => 3, r: { money: 0.6, xp: 0.8 } },
  { id: 'followers',  icon: 'users',    text: (n) => `Gain ${n} followers`,        evt: 'fans',      target: (l, s) => Math.max(40, Math.round((s.totalFans || 50) * 0.08 / 10) * 10), r: { money: 1.2, xp: 1.2 } },
  { id: 'upgrade',    icon: 'cart',     text: () => 'Buy a setup upgrade',         evt: 'buy',       target: () => 1, r: { money: 0.8, sparks: 3 } },
  { id: 'eat',        icon: 'food',     text: () => 'Eat a meal',                  evt: 'eat',       target: () => 1, r: { money: 0.4, xp: 0.5 } },
  { id: 'viewers',    icon: 'eye',      text: (n) => `Reach ${n} live viewers`,    evt: 'peak',      target: (l, s) => Math.max(15, Math.round((s.peakViewers || 15) * 1.1 / 5) * 5), max: true, r: { money: 1.2, xp: 1.2 } },
  { id: 'trending',   icon: 'flame',    text: () => 'Upload a trending game',      evt: 'trendvid',  target: () => 1, r: { money: 1, sparks: 3 } },
  { id: 'perfect',    icon: 'target',   text: (n) => `Hit ${n} PERFECT moments`,   evt: 'perfect',   target: () => 10, r: { money: 0.8, xp: 1 } },
  { id: 'thanks',     icon: 'heart',    text: (n) => `Thank ${n} donations`,       evt: 'thank',     target: () => 3, r: { money: 1, xp: 1 } },
  { id: 'clip',       icon: 'scissors', text: (n) => `Clip ${n} stream moments`,   evt: 'clip',      target: () => 2, r: { money: 0.8, sparks: 2 } },
  { id: 'earn',       icon: 'dollar',   text: (n) => `Earn $${n}`,                 evt: 'earn',      target: (l) => Math.round(150 * Math.pow(l, 1.6) / 50) * 50, r: { xp: 1.4, sparks: 2 } },
  { id: 'sleep',      icon: 'bed',      text: () => 'Get a good night\'s sleep',   evt: 'sleep',     target: () => 1, r: { money: 0.5, xp: 0.6 } },
];
export const QUEST_BONUS = { sparks: 12, tickets: 3 };
