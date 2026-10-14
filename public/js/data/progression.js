// Player level curve, career titles and unlock announcements.
export const MAX_LEVEL = 40;
export function xpForLevel(n) { return Math.round(55 * Math.pow(n, 1.6) + 25 * n); }

export const CAREER = [
  { from: 1,  title: 'Beginner Creator' },
  { from: 4,  title: 'Small Niche Creator' },
  { from: 8,  title: 'Rising Streamer' },
  { from: 13, title: 'Known Personality' },
  { from: 19, title: 'Major Influencer' },
  { from: 26, title: 'Elite Creator' },
  { from: 34, title: 'Internet Legend' },
];
export const careerTitle = (lvl) => [...CAREER].reverse().find((c) => lvl >= c.from).title;

// Feature unlocks by level (content/gear/games are derived automatically from their data tables).
export const FEATURES = [
  { id: 'quests',     level: 1,  name: 'Daily Quests',      icon: 'target' },
  { id: 'partner',    level: 3,  name: 'Partner Program',   icon: 'dollar', desc: '+40% video revenue' },
  { id: 'inbox',      level: 3,  name: 'Fan Inbox',         icon: 'mail' },
  { id: 'polls',      level: 4,  name: 'Stream Polls',      icon: 'chart' },
  { id: 'deals',      level: 5,  name: 'Brand Deals',       icon: 'handshake' },
  { id: 'analytics2', level: 7,  name: 'Advanced Analytics',icon: 'chart' },
  { id: 'lumo',       level: 8,  name: 'Lumo Platform',     icon: 'lumo' },
  { id: 'raids',      level: 8,  name: 'Raids',             icon: 'rocket' },
  { id: 'giveaway',   level: 9,  name: 'Giveaways',         icon: 'gift' },
  { id: 'collabs',    level: 10, name: 'Collabs',           icon: 'handshake' },
  { id: 'team',       level: 10, name: 'Creator Team',      icon: 'team' },
  { id: 'awards',     level: 15, name: 'Creator Awards',    icon: 'trophy' },
];
export const hasFeature = (state, id) => { const f = FEATURES.find((x) => x.id === id); return !f || state.level >= f.level; };

// Subscriber milestones → wall plaques
export const MILESTONES = [
  { id: 'm100',   at: 100,      name: 'First 100',     reward: { money: 100, sparks: 5 },   plaque: null },
  { id: 'm1k',    at: 1000,     name: 'Bronze Disc',   reward: { money: 400, sparks: 15 },  plaque: '#d08a52' },
  { id: 'm10k',   at: 10000,    name: 'Silver Disc',   reward: { money: 2500, sparks: 30 }, plaque: '#d9e2ec' },
  { id: 'm100k',  at: 100000,   name: 'Gold Disc',     reward: { money: 15000, sparks: 60 },plaque: '#ffcf4a' },
  { id: 'm1m',    at: 1000000,  name: 'Diamond Disc',  reward: { money: 90000, sparks: 120 }, plaque: '#9ff0ff' },
  { id: 'm10m',   at: 10000000, name: 'Ruby Disc',     reward: { money: 500000, sparks: 250 }, plaque: '#ff3b6b' },
];

// Team hires (late game)
export const TEAM = [
  { id: 'editor',  name: 'Video Editor',   icon: 'scissors', price: 9000,  level: 10, desc: 'Auto-edit at 95%' },
  { id: 'mod',     name: 'Chat Moderator', icon: 'hammer',   price: 7000,  level: 11, desc: 'Auto-bans trolls' },
  { id: 'manager', name: 'Talent Manager', icon: 'briefcase',price: 30000, level: 13, desc: '+35% deal pay' },
];
