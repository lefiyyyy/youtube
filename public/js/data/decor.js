// Decor items placed into room slots. slot: wall | floor | shelf | desk | rug | kitchen
// vibe raises Room Vibe (stream charisma + Lumo posts). spark = premium price in Sparks.
export const DECOR = [
  { id: 'poster_pixel',  name: 'Pixel Hero Poster', slot: 'wall',   price: 30,   level: 1,  vibe: 2 },
  { id: 'string_lights', name: 'Fairy Lights',      slot: 'wall',   price: 55,   level: 1,  vibe: 3, glow: true },
  { id: 'plant_small',   name: 'Desk Succulent',    slot: 'shelf',  price: 25,   level: 1,  vibe: 1 },
  { id: 'rug_round',     name: 'Fluffy Rug',        slot: 'rug',    price: 70,   level: 1,  vibe: 3 },
  { id: 'plant_big',     name: 'Monstera',          slot: 'floor',  price: 95,   level: 2,  vibe: 3 },
  { id: 'beanbag',       name: 'Bean Bag',          slot: 'floor',  price: 130,  level: 2,  vibe: 3 },
  { id: 'poster_game',   name: 'Game Art Print',    slot: 'wall',   price: 60,   level: 2,  vibe: 3 },
  { id: 'figures',       name: 'Figure Collection', slot: 'shelf',  price: 140,  level: 3,  vibe: 4 },
  { id: 'hex_lights',    name: 'Hex Light Panels',  slot: 'wall',   price: 280,  level: 3,  vibe: 6, glow: true },
  { id: 'foam',          name: 'Acoustic Foam',     slot: 'wall',   price: 220,  level: 3,  vibe: 2, aq: 1 },
  { id: 'coffee',        name: 'Espresso Machine',  slot: 'kitchen',price: 240,  level: 3,  vibe: 1, unlockFood: 'espresso' },
  { id: 'neon_name',     name: 'Custom Neon Sign',  slot: 'wall',   price: 420,  level: 4,  vibe: 8, glow: true },
  { id: 'bookshelf',     name: 'Bookshelf',         slot: 'floor',  price: 320,  level: 4,  vibe: 4 },
  { id: 'cat',           name: 'Pet Cat',           slot: 'pet',    price: 650,  level: 5,  vibe: 8 },
  { id: 'guitar',        name: 'Wall Guitar',       slot: 'wall',   price: 380,  level: 5,  vibe: 4 },
  { id: 'fishtank',      name: 'Glow Aquarium',     slot: 'floor',  price: 950,  level: 7,  vibe: 7, glow: true },
  { id: 'arcade',        name: 'Arcade Cabinet',    slot: 'floor',  price: 1600, level: 8,  vibe: 10, glow: true },
  { id: 'telescope',     name: 'Telescope',         slot: 'floor',  price: 900,  level: 9,  vibe: 5 },
  { id: 'art_canvas',    name: 'Abstract Canvas',   slot: 'wall',   price: 1200, level: 10, vibe: 6 },
  { id: 'sculpture',     name: 'Designer Sculpture',slot: 'floor',  price: 9000, level: 14, vibe: 10 },
  { id: 'gold_records',  name: 'Platinum Wall',     slot: 'wall',   price: 18000, level: 18, vibe: 12 },
  // Spark (premium soft currency) items
  { id: 'holo_plant',    name: 'Holo Plant',        slot: 'shelf',  spark: 30, level: 2,  vibe: 6, glow: true },
  { id: 'lava_lamp',     name: 'Lava Lamp',         slot: 'desk',   spark: 20, level: 1,  vibe: 4, glow: true },
  { id: 'crt_tv',        name: 'Retro CRT',         slot: 'floor',  spark: 45, level: 3,  vibe: 7, glow: true },
  // Exclusives (rewards only)
  { id: 'neon_cat',      name: 'Neon Cat Sign',     slot: 'wall',   exclusive: 'Daily Reward', vibe: 8, glow: true },
  { id: 'pumpkin_lamp',  name: 'Haunted Pumpkin',   slot: 'shelf',  exclusive: 'Horror Week', vibe: 7, glow: true },
  { id: 'pixel_cabinet', name: 'Pixel Arcade',      slot: 'floor',  exclusive: 'Retro Festival', vibe: 12, glow: true },
  { id: 'onair_sign',    name: 'ON AIR Sign',       slot: 'wall',   exclusive: 'Stream Rush', vibe: 9, glow: true },
  { id: 'trophy_case',   name: 'Awards Trophy',     slot: 'shelf',  exclusive: 'Creator Awards', vibe: 10 },
  { id: 'disco_ball',    name: 'Disco Ball',        slot: 'ceiling',exclusive: 'Collab Fest', vibe: 9, glow: true },
  { id: 'gold_plant',    name: 'Golden Bonsai',     slot: 'shelf',  exclusive: 'Sponsor Season', vibe: 9 },
];
export const decorById = (id) => DECOR.find((d) => d.id === id);

// Room style themes (walls, floor, fabrics). LED accent color is chosen separately.
export const THEMES = {
  cozy:    { name: 'Cozy',            level: 1,  price: 0,    wall: '#e9d6c3', wall2: '#d9c0a8', trim: '#f6ece2', floor: 'wood',   floorTint: '#b98559', fabric: '#f3a9a0', fabric2: '#fdf1e6', wood: '#b37a4c', metal: '#2b2b33' },
  gamer:   { name: 'RGB Gamer',       level: 1,  price: 0,    wall: '#323556', wall2: '#282a46', trim: '#3d4068', floor: 'wood',   floorTint: '#6e5548', fabric: '#4b4f8c', fabric2: '#2e3156', wood: '#3a3445', metal: '#16161f' },
  minimal: { name: 'Clean Minimal',   level: 4,  price: 900,  wall: '#eef0f2', wall2: '#e2e5e9', trim: '#ffffff', floor: 'oak',    floorTint: '#dcc2a0', fabric: '#c8d3dc', fabric2: '#f7f9fb', wood: '#e2c9a6', metal: '#e8e8ea' },
  luxury:  { name: 'Luxury Creator',  level: 12, price: 20000, wall: '#1f3b36', wall2: '#183029', trim: '#c9a45c', floor: 'marble', floorTint: '#ece7df', fabric: '#2e5a52', fabric2: '#efe6d6', wood: '#5b3a28', metal: '#c9a45c' },
  tech:    { name: 'High-Tech Studio',level: 16, price: 35000,wall: '#101828', wall2: '#0c1220', trim: '#1fd2ff', floor: 'tile',   floorTint: '#2a3245', fabric: '#2a3a5c', fabric2: '#1a2234', wood: '#222b3d', metal: '#9aa7bd' },
  spooky:  { name: 'Haunted Neon',    level: 1,  price: 0,    wall: '#2b1a33', wall2: '#22152a', trim: '#ff8a3d', floor: 'wood',   floorTint: '#3e2c33', fabric: '#6b2f5a', fabric2: '#2b1a33', wood: '#3a2430', metal: '#18121c', exclusive: 'Horror Week' },
};
export const ACCENTS = ['#ff4f8b', '#8f6bff', '#2fd6ff', '#9dff5a', '#ffb547', '#ff5d5d'];

// Homes (room tiers).
export const HOMES = [
  { id: 0, name: 'Tiny Bedroom',      level: 1,  price: 0,      size: [6, 5],   height: 2.7, slots: { wall: 4, floor: 3, shelf: 3, desk: 2, rug: 1, kitchen: 1, pet: 1, ceiling: 1 }, viewMult: 1.0 },
  { id: 1, name: 'City Apartment',    level: 6,  price: 3500,   size: [8, 6],   height: 2.8, slots: { wall: 6, floor: 5, shelf: 4, desk: 2, rug: 1, kitchen: 1, pet: 1, ceiling: 1 }, viewMult: 1.12 },
  { id: 2, name: 'Creator Loft',      level: 12, price: 60000,  size: [10, 7],  height: 3.3, slots: { wall: 8, floor: 7, shelf: 6, desk: 3, rug: 2, kitchen: 1, pet: 1, ceiling: 1 }, viewMult: 1.28 },
  { id: 3, name: 'Skyline Penthouse', level: 20, price: 400000, size: [12, 8],  height: 3.6, slots: { wall: 10, floor: 9, shelf: 8, desk: 3, rug: 2, kitchen: 1, pet: 1, ceiling: 1 }, viewMult: 1.5 },
];
