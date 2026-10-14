// Content types for videos. Minigame config tunes the recording sequence.
export const CONTENT = [
  { id: 'gameplay',    name: 'Gameplay',         icon: 'gamepad',  level: 1,  energy: 14, hunger: 8,  hours: 2, views: 1.0,  subs: 1.0,  money: 1.0,  xp: 34,
    game: { dur: 13, density: 0.85, gold: 0.18, red: 0.16, speed: 1.0 }, tip: 'Steady growth' },
  { id: 'funny',       name: 'Funny Highlights', icon: 'laugh',    level: 2,  energy: 14, hunger: 8,  hours: 2, views: 1.25, subs: 0.9,  money: 1.0,  xp: 38,
    game: { dur: 12, density: 0.95, gold: 0.15, red: 0.28, speed: 1.05, blooper: true }, tip: 'Big views, bloopers count!' },
  { id: 'review',      name: 'Review',           icon: 'star',     level: 3,  energy: 12, hunger: 7,  hours: 2, views: 0.92, subs: 1.4,  money: 1.35, xp: 40,
    game: { dur: 12, density: 0.75, gold: 0.25, red: 0.12, speed: 0.95 }, tip: 'Loyal subs, better pay' },
  { id: 'challenge',   name: 'Challenge Run',    icon: 'mountain', level: 4,  energy: 20, hunger: 10, hours: 3, views: 1.45, subs: 1.15, money: 1.1,  xp: 52,
    game: { dur: 14, density: 1.15, gold: 0.22, red: 0.2, speed: 1.3, holds: true }, tip: 'Hard but huge' },
  { id: 'walkthrough', name: 'Walkthrough',      icon: 'map',      level: 6,  energy: 16, hunger: 9,  hours: 3, views: 0.9,  subs: 1.25, money: 1.2,  xp: 46, tail: 2.2,
    game: { dur: 13, density: 0.8, gold: 0.2, red: 0.12, speed: 1.0, holds: true }, tip: 'Views keep coming' },
  { id: 'reaction',    name: 'Reaction',         icon: 'eye',      level: 8,  energy: 12, hunger: 7,  hours: 2, views: 1.35, subs: 1.0,  money: 1.0,  xp: 44, trendy: 1.35,
    game: { dur: 11, density: 1.0, gold: 0.28, red: 0.15, speed: 1.1 }, tip: 'Loves trends' },
  { id: 'collab',      name: 'Collab',           icon: 'handshake',level: 10, energy: 18, hunger: 9,  hours: 3, views: 1.6,  subs: 1.5,  money: 1.2,  xp: 70, needsPartner: true,
    game: { dur: 13, density: 0.95, gold: 0.24, red: 0.15, speed: 1.1, holds: true }, tip: 'Share audiences' },
  { id: 'mega',        name: 'Mega Production',  icon: 'film',     level: 18, energy: 32, hunger: 16, hours: 5, views: 2.3,  subs: 1.7,  money: 1.6,  xp: 150,
    game: { dur: 16, density: 1.2, gold: 0.25, red: 0.2, speed: 1.35, holds: true }, tip: 'Event-level hit' },
];
export const contentById = (id) => CONTENT.find((c) => c.id === id);

// Thumbnail styles & title archetypes for the publishing step.
export const THUMBS = [
  { id: 'shock', name: 'Shocked', icon: 'zap', ctr: 1.22, trust: 0.85, expr: 'shocked' },
  { id: 'clean', name: 'Clean',   icon: 'sparkle', ctr: 1.0, trust: 1.15, expr: 'happy' },
  { id: 'meme',  name: 'Meme',    icon: 'laugh', ctr: 1.12, trust: 1.0, expr: 'cool' },
  { id: 'neon',  name: 'Neon Pro',icon: 'crown', ctr: 1.25, trust: 1.1, expr: 'cool', pack: true },
];

const TITLE_T = {
  hype: [
    'I Played {g} For 24 Hours Straight',
    '{G} Is NOT What I Expected...',
    'This {g} Moment Broke Me',
    'I Tried The IMPOSSIBLE in {g}',
    'Why Is Nobody Talking About {g}?!',
  ],
  honest: [
    '{g} — {c} #{n}',
    'Chill {g} {c} (no commentary skips)',
    '{g}: Everything You Need To Know',
    'My Honest Take on {g}',
    '{g} {c} — Part {n}',
  ],
  trend: [
    '{G} IS TRENDING — here\'s why',
    'Everyone Is Playing {g} Right Now',
    'The {g} Meta Just Changed',
    '{g} Update Hype! First Look',
  ],
};
export function makeTitles(game, content, n) {
  const fill = (t) => t.replace(/\{g\}/g, game.name).replace(/\{G\}/g, game.name.toUpperCase()).replace(/\{c\}/g, content.name).replace(/\{n\}/g, n);
  const p = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return [
    { id: 'hype', label: 'Clickbait', text: fill(p(TITLE_T.hype)), ctr: 1.25, trust: 0.82, trend: 1 },
    { id: 'honest', label: 'Honest', text: fill(p(TITLE_T.honest)), ctr: 0.95, trust: 1.25, trend: 1 },
    { id: 'trend', label: 'Trendy', text: fill(p(TITLE_T.trend)), ctr: 1.05, trust: 1.0, trend: 1.25 },
  ];
}
