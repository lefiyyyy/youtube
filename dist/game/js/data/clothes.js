// Wardrobe: free basics (colorable) and brand fashion sold in the Fashion shop.
// Items are data-driven: `style` picks the 3D model, `print` a chest/thigh graphic, colors are fixed for brand pieces.
export const SLOTS = ['top', 'bottom', 'shoes', 'hat', 'eyes', 'neck'];
export const SLOT_NAMES = { top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes', hat: 'Headwear', eyes: 'Eyewear', neck: 'Jewelry' };
export const SLOT_ICONS = { top: 'shirt', bottom: 'pants', shoes: 'shoe', hat: 'cap', eyes: 'glasses', neck: 'gem' };

export const BRANDS_FASHION = {
  'Carhartt WIP': { color: '#c98a3c', tier: 1 },
  'Nike': { color: '#f4f4f6', tier: 1 },
  'Stüssy': { color: '#f2efe6', tier: 1 },
  'Ralph Lauren': { color: '#203a6e', tier: 2 },
  "Arc'teryx": { color: '#3a6b5c', tier: 2 },
  'Stone Island': { color: '#e9e2c9', tier: 3 },
  'Off-White': { color: '#f6f6f2', tier: 3 },
  'Moncler': { color: '#1d2b4a', tier: 4 },
  'Balenciaga': { color: '#111114', tier: 4 },
  'Rick Owens': { color: '#0e0e10', tier: 5 },
  'Chrome Hearts': { color: '#c8ccd4', tier: 5 },
};

const B = (o) => ({ basic: true, price: 0, level: 1, drip: 0, ...o });
export const CLOTHES = [
  // ---------------- basics (always owned, colorable)
  B({ id: 'hoodie', slot: 'top', name: 'Hoodie', style: 'hoodie' }),
  B({ id: 'tee', slot: 'top', name: 'Tee', style: 'tee', print: 'badge' }),
  B({ id: 'longtee', slot: 'top', name: 'Long Tee', style: 'longtee' }),
  B({ id: 'sweater', slot: 'top', name: 'Knit', style: 'knit' }),
  B({ id: 'jacket', slot: 'top', name: 'Varsity', style: 'varsity' }),
  B({ id: 'tech', slot: 'top', name: 'Techwear', style: 'tech' }),
  B({ id: 'crop', slot: 'top', name: 'Crop Top', style: 'crop' }),
  B({ id: 'jeans', slot: 'bottom', name: 'Jeans', style: 'jeans' }),
  B({ id: 'joggers', slot: 'bottom', name: 'Joggers', style: 'joggers' }),
  B({ id: 'shorts', slot: 'bottom', name: 'Shorts', style: 'shorts' }),
  B({ id: 'skirt', slot: 'bottom', name: 'Skirt', style: 'skirt' }),
  B({ id: 'sneakers', slot: 'shoes', name: 'Sneakers', style: 'sneaker' }),
  B({ id: 'boots', slot: 'shoes', name: 'Boots', style: 'boot' }),
  B({ id: 'headphones', slot: 'hat', name: 'Headset', style: 'headphones' }),
  B({ id: 'cap', slot: 'hat', name: 'Cap', style: 'cap' }),
  B({ id: 'beanie', slot: 'hat', name: 'Beanie', style: 'beanie' }),
  B({ id: 'catears', slot: 'hat', name: 'Cat Headset', style: 'catears' }),
  B({ id: 'glasses', slot: 'eyes', name: 'Glasses', style: 'glasses' }),

  // ---------------- brand fashion
  { id: 'cw_beanie', slot: 'hat', brand: 'Carhartt WIP', name: 'Watch Beanie', style: 'beanie', color: '#c98a3c', print: 'label', pc: '#1b1b1b', price: 45, level: 1, drip: 3 },
  { id: 'nk_af1', slot: 'shoes', brand: 'Nike', name: 'Court Low White', style: 'sneaker', color: '#f7f7f7', sole: '#f2f2f2', trim: '#f7f7f7', price: 110, level: 1, drip: 4 },
  { id: 'st_tee', slot: 'top', brand: 'Stüssy', name: 'World Tour Tee', style: 'tee', color: '#f2efe6', print: 'script', pc: '#111111', price: 65, level: 1, drip: 4 },
  { id: 'cw_pants', slot: 'bottom', brand: 'Carhartt WIP', name: 'Double Knee Pants', style: 'cargo', color: '#8a5a2b', price: 140, level: 2, drip: 5 },
  { id: 'rl_polo', slot: 'top', brand: 'Ralph Lauren', name: 'Classic Pony Polo', style: 'polo', color: '#203a6e', print: 'pony', pc: '#e6c66a', price: 140, level: 2, drip: 6 },
  { id: 'rl_chino', slot: 'bottom', brand: 'Ralph Lauren', name: 'Slim Chinos', style: 'chino', color: '#cdb98f', price: 120, level: 2, drip: 4 },
  { id: 'nk_dunk', slot: 'shoes', brand: 'Nike', name: 'Panda Low', style: 'sneaker', color: '#f4f4f4', trim: '#151515', sole: '#f4f4f4', price: 180, level: 3, drip: 6 },
  { id: 'cw_jacket', slot: 'top', brand: 'Carhartt WIP', name: 'Detroit Jacket', style: 'work', color: '#b07a3a', color2: '#2a2018', price: 260, level: 3, drip: 8 },
  { id: 'st_hoodie', slot: 'top', brand: 'Stüssy', name: '8 Ball Hoodie', style: 'hoodie', color: '#1c1c1f', print: 'eightball', pc: '#f4f4f4', price: 180, level: 3, drip: 7 },
  { id: 'rl_knit', slot: 'top', brand: 'Ralph Lauren', name: 'Cable Knit Sweater', style: 'knit', color: '#efe7d4', print: 'pony', pc: '#203a6e', price: 420, level: 4, drip: 10 },
  { id: 'rl_cap', slot: 'hat', brand: 'Ralph Lauren', name: 'Pony Cap', style: 'cap', color: '#203a6e', print: 'pony', pc: '#e6c66a', price: 85, level: 4, drip: 4 },
  { id: 'ax_shell', slot: 'top', brand: "Arc'teryx", name: 'Alpha Shell', style: 'shell', color: '#2f5f52', print: 'bird', pc: '#e8efe9', price: 750, level: 5, drip: 13 },
  { id: 'si_crew', slot: 'top', brand: 'Stone Island', name: 'Compass Crewneck', style: 'crew', color: '#e4dcc0', print: 'compass', pc: '#1b1b1b', price: 520, level: 5, drip: 12 },
  { id: 'ow_tee', slot: 'top', brand: 'Off-White', name: 'Diagonal Arrows Tee', style: 'tee', color: '#f6f6f2', print: 'stripes', pc: '#111111', price: 480, level: 6, drip: 12 },
  { id: 'ow_belt', slot: 'neck', brand: 'Off-White', name: 'Industrial Lanyard', style: 'lanyard', color: '#ffd400', price: 260, level: 6, drip: 6 },
  { id: 'gold_chain', slot: 'neck', brand: null, name: 'Gold Cuban Chain', style: 'chain', color: '#ffcf5a', price: 900, level: 7, drip: 11 },
  { id: 'bl_triple', slot: 'shoes', brand: 'Balenciaga', name: 'Triple Sole Runner', style: 'chunky', color: '#ece8e1', trim: '#c9c3b8', sole: '#d9d2c5', price: 1100, level: 7, drip: 16 },
  { id: 'mc_puffer', slot: 'top', brand: 'Moncler', name: 'Maya Puffer', style: 'puffer', color: '#1d2b4a', print: 'patch', pc: '#ffffff', price: 1600, level: 8, drip: 18 },
  { id: 'bl_hoodie', slot: 'top', brand: 'Balenciaga', name: 'Oversized Logo Hoodie', style: 'hoodie', color: '#111114', print: 'word:BALENCIAGA', pc: '#f2f2f2', oversize: true, price: 1400, level: 9, drip: 18 },
  { id: 'pearls', slot: 'neck', brand: null, name: 'Pearl Necklace', style: 'pearls', color: '#f5f1ea', price: 650, level: 9, drip: 9 },
  { id: 'ro_tee', slot: 'top', brand: 'Rick Owens', name: 'Level Drape Tee', style: 'longtee', color: '#0f0f11', oversize: true, price: 850, level: 10, drip: 16 },
  { id: 'ro_cargo', slot: 'bottom', brand: 'Rick Owens', name: 'Drop-Crotch Cargo', style: 'drape', color: '#131315', price: 1200, level: 10, drip: 17 },
  { id: 'ro_geo', slot: 'shoes', brand: 'Rick Owens', name: 'Geo High-Tops', style: 'high', color: '#111112', trim: '#f2f2f2', sole: '#f4f4f4', price: 1500, level: 11, drip: 20 },
  { id: 'ch_trucker', slot: 'hat', brand: 'Chrome Hearts', name: 'Cross Trucker Hat', style: 'trucker', color: '#111111', color2: '#f2f2f2', print: 'cross', pc: '#e9ecf2', price: 900, level: 11, drip: 14 },
  { id: 'ch_shades', slot: 'eyes', brand: 'Chrome Hearts', name: 'Silver Frame Shades', style: 'shades', color: '#c8ccd4', price: 1800, level: 12, drip: 16 },
  { id: 'ch_hoodie', slot: 'top', brand: 'Chrome Hearts', name: 'Horseshoe Cross Hoodie', style: 'hoodie', color: '#0f0f10', print: 'cross', pc: '#f3f4f6', price: 2500, level: 12, drip: 24 },
  { id: 'ch_jeans', slot: 'bottom', brand: 'Chrome Hearts', name: 'Cross Patch Denim', style: 'jeans', color: '#2a3550', print: 'crosspatch', pc: '#f3f4f6', price: 2200, level: 13, drip: 22 },
  { id: 'ch_cross', slot: 'neck', brand: 'Chrome Hearts', name: 'Sterling Cross Pendant', style: 'cross', color: '#d9dde4', price: 3200, level: 14, drip: 22 },
  // Event / reward exclusives (granted, not sold)
  { id: 'hoodie_ghost', slot: 'top', brand: null, name: 'Ghost Hoodie', style: 'hoodie', color: '#f2f0f7', print: 'ghost', pc: '#a58bff', exclusive: 'Event reward', price: 0, level: 1, drip: 10 },
  { id: 'jacket_pixel', slot: 'top', brand: null, name: 'Pixel Jacket', style: 'varsity', color: '#1d1b2c', color2: '#ff3df2', print: 'pixel', exclusive: 'Event reward', price: 0, level: 1, drip: 12 },
];
export const clothById = (id) => CLOTHES.find((c) => c.id === id);

export const DEFAULT_WEAR = {
  m: { top: 'hoodie', bottom: 'jeans', shoes: 'sneakers', hat: 'headphones', eyes: null, neck: null },
  f: { top: 'hoodie', bottom: 'jeans', shoes: 'sneakers', hat: 'headphones', eyes: null, neck: null },
};

// Old profile fields -> wardrobe ids (saves from before the fashion update, and NPC creator profiles)
const OLD_TOP = { hoodie: 'hoodie', tee: 'tee', jacket: 'jacket', sweater: 'sweater', tech: 'tech', hoodie_ghost: 'hoodie_ghost', jacket_pixel: 'jacket_pixel' };
export function wearOf(p) {
  if (p.wear) return p.wear;
  const acc = p.accessory || 'none';
  return {
    top: OLD_TOP[p.outfit] || 'hoodie', bottom: 'jeans', shoes: p.outfit === 'tech' ? 'boots' : 'sneakers',
    hat: ['headphones', 'cap', 'beanie', 'catears'].includes(acc) ? acc : null, eyes: acc === 'glasses' ? 'glasses' : null, neck: null,
  };
}

// Resolve a profile into concrete per-slot looks consumed by the character builder.
export function resolveLook(p) {
  const wear = wearOf(p);
  const col = p.col || {};
  const look = {};
  for (const slot of SLOTS) {
    const it = wear[slot] ? clothById(wear[slot]) : null;
    if (!it) { look[slot] = null; continue; }
    const L = { id: it.id, style: it.style, print: it.print || null, pc: it.pc || '#ffffff', oversize: !!it.oversize };
    if (it.basic) {
      if (slot === 'top') { L.color = col.top || p.top || '#8f6bff'; L.color2 = it.style === 'varsity' ? '#f1ece2' : null; L.pc = p.accent || '#ff4f8b'; }
      else if (slot === 'bottom') L.color = col.bottom || p.bottom || '#2b2f45';
      else if (slot === 'shoes') { L.color = it.style === 'boot' ? '#3a2a20' : (col.shoes || '#f4f4f6'); L.sole = it.style === 'boot' ? '#1d1714' : '#2a2a35'; L.trim = p.accent || '#ff4f8b'; }
      else L.color = col.hat || p.accent || '#ff4f8b';
    } else {
      L.color = it.color; L.color2 = it.color2 || null; L.sole = it.sole || '#2a2a35'; L.trim = it.trim || it.color;
    }
    look[slot] = L;
  }
  if (!look.top) look.top = { style: 'tee', color: '#f4f2ee', pc: '#ffffff' };
  if (!look.bottom) look.bottom = { style: 'jeans', color: '#2b2f45' };
  if (!look.shoes) look.shoes = { style: 'sneaker', color: '#f4f4f6', sole: '#2a2a35', trim: '#ff4f8b' };
  return look;
}

// Total "drip" (style score) of what's worn: feeds Fit Check posts and party charm.
export function dripOf(p) {
  const wear = wearOf(p);
  let d = 0;
  for (const slot of SLOTS) { const it = wear[slot] && clothById(wear[slot]); if (it) d += it.drip || 0; }
  return d;
}
export const dripLabel = (d) => d >= 70 ? 'Icon' : d >= 45 ? 'Fashion Week' : d >= 25 ? 'Hypebeast' : d >= 10 ? 'Fresh' : 'Casual';
