// Fictional brands for sponsorship deals.
export const BRANDS = [
  { id: 'volt',   name: 'VoltCan',      cat: 'Energy Drink', color: '#c6ff00', ink: '#10131a', mark: 'V' },
  { id: 'nova',   name: 'NovaKeys',     cat: 'Keyboards',    color: '#8f6bff', ink: '#ffffff', mark: 'N' },
  { id: 'snacc',  name: 'Snaccbox',     cat: 'Snacks',       color: '#ffb547', ink: '#2a1600', mark: 'S' },
  { id: 'shield', name: 'ShieldByte',   cat: 'VPN',          color: '#2fd6ff', ink: '#06222b', mark: 'SB' },
  { id: 'grip',   name: 'GripSeat',     cat: 'Chairs',       color: '#ff5d5d', ink: '#ffffff', mark: 'G' },
  { id: 'lumina', name: 'Lumina',       cat: 'Smart Lights', color: '#ffe066', ink: '#2a2300', mark: 'L' },
  { id: 'thread', name: 'Pixel Threads',cat: 'Streetwear',   color: '#ff4f8b', ink: '#ffffff', mark: 'PT' },
  { id: 'hex',    name: 'Hexacore',     cat: 'GPUs',         color: '#4fd37b', ink: '#04210f', mark: 'H' },
  { id: 'orbit',  name: 'Orbit Mobile', cat: 'Phones',       color: '#7aa2ff', ink: '#ffffff', mark: 'O' },
  { id: 'crumbs', name: 'Crumbs',       cat: 'Food Delivery',color: '#ff9f43', ink: '#2a1200', mark: 'C' },
];
export const DEAL_TYPES = [
  { req: 'video',  text: 'Feature in 1 video',   icon: 'film',  mult: 1.0 },
  { req: 'stream', text: 'Shoutout on 1 stream', icon: 'live',  mult: 0.9 },
  { req: 'post',   text: 'Sponsored Blip post',  icon: 'blip',  mult: 0.55 },
  { req: 'lumo',   text: 'Lumo product photo',   icon: 'lumo',  mult: 0.7, level: 8 },
];
// Collab partners (NPC creators)
export const CREATORS = [
  { id: 'luna',   name: 'LunaLoops',    niche: 'cozy',       fans: 1500,    color: '#ff9fc6', hair: '#3b2a4f', skin: '#f2c7a5', cost: 0 },
  { id: 'turbo',  name: 'TurboTariq',   niche: 'racing',     fans: 6000,    color: '#ffb547', hair: '#1d1a1a', skin: '#a8714a', cost: 300 },
  { id: 'spooky', name: 'SpookySam',    niche: 'horror',     fans: 20000,   color: '#ff5470', hair: '#e8e8f0', skin: '#e9b48e', cost: 900 },
  { id: 'nia',    name: 'NoScopeNia',   niche: 'shooter',    fans: 70000,   color: '#2fd6ff', hair: '#ff4f8b', skin: '#6d4430', cost: 2600 },
  { id: 'mika',   name: 'MegaMika',     niche: 'challenge',  fans: 250000,  color: '#9dff5a', hair: '#f5d36b', skin: '#f5d0b5', cost: 8000 },
  { id: 'king',   name: 'KingCrafter',  niche: 'sandbox',    fans: 1000000, color: '#8f6bff', hair: '#5a3a22', skin: '#c68a62', cost: 25000 },
];
