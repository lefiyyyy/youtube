// Game library: fictional games the creator can play for content.
export const GENRES = {
  horror:      { name: 'Horror',      color: '#ff5470', icon: 'ghost' },
  racing:      { name: 'Racing',      color: '#ffb547', icon: 'flag' },
  shooter:     { name: 'Shooter',     color: '#ff7a45', icon: 'crosshair' },
  sandbox:     { name: 'Sandbox',     color: '#4fd37b', icon: 'cube' },
  cozy:        { name: 'Cozy',        color: '#ff9fc6', icon: 'leaf' },
  challenge:   { name: 'Challenge',   color: '#b48cff', icon: 'mountain' },
  retro:       { name: 'Retro',       color: '#38d6f5', icon: 'pixel' },
  multiplayer: { name: 'Multiplayer', color: '#7aa2ff', icon: 'users' },
};
export const GENRE_IDS = Object.keys(GENRES);

// scene = which animated screen renderer draws gameplay. pal = palette for the renderer & cover art.
export const GAMES = [
  { id: 'blocktopia',  name: 'Blocktopia',        tags: ['sandbox', 'multiplayer'],  price: 0,    level: 1,  appeal: 1.0,  scene: 'sandbox',  pal: ['#7fd858', '#57b3ff', '#9b6a3c', '#e8f7ff'] },
  { id: 'pixelkart',   name: 'Pixel Kart DX',     tags: ['racing', 'retro'],         price: 0,    level: 1,  appeal: 1.0,  scene: 'racing',   pal: ['#ff4f8b', '#2b2d6e', '#ffd166', '#53e0a6'] },
  { id: 'cozyacres',   name: 'Cozy Acres',        tags: ['cozy', 'sandbox'],         price: 60,   level: 1,  appeal: 1.08, scene: 'cozy',     pal: ['#8fd26b', '#ffd1a6', '#e86f6f', '#fff4d6'] },
  { id: 'nightshift',  name: 'Night Shift',       tags: ['horror'],                  price: 90,   level: 2,  appeal: 1.15, scene: 'horror',   pal: ['#0d0f17', '#ffe28a', '#7a1f2b', '#9fb4c7'] },
  { id: 'rageclimb',   name: 'Rage Climb',        tags: ['challenge'],               price: 80,   level: 2,  appeal: 1.12, scene: 'climb',    pal: ['#7fc8ff', '#f25f5c', '#ffe066', '#3d405b'] },
  { id: 'riftarena',   name: 'Rift Arena',        tags: ['shooter', 'multiplayer'],  price: 180,  level: 3,  appeal: 1.22, scene: 'shooter',  pal: ['#1c2541', '#ff6b35', '#5bc0eb', '#e0fbfc'] },
  { id: 'dungeondash', name: 'Dungeon Dash',      tags: ['retro', 'challenge'],      price: 150,  level: 4,  appeal: 1.18, scene: 'dungeon',  pal: ['#2b2140', '#ffb000', '#7cfc9a', '#e45a84'] },
  { id: 'neondrift',   name: 'Neon Drift 2088',   tags: ['racing'],                  price: 420,  level: 5,  appeal: 1.32, scene: 'racing',   pal: ['#ff2fd1', '#120a2e', '#2ff3ff', '#fff36b'] },
  { id: 'hollowmanor', name: 'Hollow Manor',      tags: ['horror', 'multiplayer'],   price: 650,  level: 6,  appeal: 1.4,  scene: 'horror',   pal: ['#140a1c', '#b8ff8a', '#5c1f3d', '#d6c7ff'] },
  { id: 'galaxyroyale',name: 'Galaxy Royale',     tags: ['shooter', 'multiplayer'],  price: 900,  level: 7,  appeal: 1.48, scene: 'space',    pal: ['#070b24', '#7b61ff', '#ff5ea8', '#5ef2ff'] },
  { id: 'tinychef',    name: 'Tiny Chef Panic',   tags: ['cozy', 'multiplayer', 'challenge'], price: 780, level: 8, appeal: 1.45, scene: 'cozy', pal: ['#ffcf56', '#ff6f59', '#57c4e5', '#fff8e8'] },
  { id: 'speedrunlg',  name: 'Speedrun Legends',  tags: ['retro', 'challenge'],      price: 1400, level: 10, appeal: 1.6,  scene: 'climb',    pal: ['#21243d', '#ff7c7c', '#ffd082', '#88e1f2'] },
  { id: 'mechasiege',  name: 'Mecha Siege',       tags: ['shooter'],                 price: 2600, level: 12, appeal: 1.72, scene: 'shooter',  pal: ['#22223b', '#f2a541', '#4ecdc4', '#f7f7ff'] },
  { id: 'starfall',    name: 'Starfall Online',   tags: ['sandbox', 'multiplayer'],  price: 4200, level: 14, appeal: 1.85, scene: 'space',    pal: ['#0b1d3a', '#ffd166', '#06d6a0', '#ef476f'] },
  { id: 'abyss',       name: 'Abyss Protocol',    tags: ['horror', 'shooter'],       price: 15000, level: 17, appeal: 2.0,  scene: 'horror',   pal: ['#05080f', '#ff3b3b', '#2de2e6', '#cfd8dc'] },
  { id: 'projectzero', name: 'Project ZERO',      tags: ['challenge', 'multiplayer'],price: 30000,level: 20, appeal: 2.3,  scene: 'shooter',  pal: ['#0a0a0a', '#c6ff00', '#ff00a0', '#ffffff'] },
  // Event exclusive (granted by events)
  { id: 'arcadeclassics', name: 'Arcade Classics', tags: ['retro', 'multiplayer'], price: 0, level: 1, appeal: 1.5, scene: 'dungeon', pal: ['#1a1033', '#ff3df2', '#3dfcff', '#ffe600'], exclusive: 'Retro Festival' },
];
export const gameById = (id) => GAMES.find((g) => g.id === id);
