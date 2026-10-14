// Setup gear. Each category has tiers; tier 0 is the starting item.
// Stats: vq (video quality), aq (audio), sq (stream stability), cq (camera/look), comfort.
export const GEAR = {
  pc: { name: 'PC', icon: 'cpu', tiers: [
    { name: 'Hand-me-down Laptop', price: 0,     level: 1,  vq: 1,  sq: 1 },
    { name: 'Budget Tower',        price: 260,   level: 2,  vq: 2,  sq: 2 },
    { name: 'Gaming Rig',          price: 950,   level: 4,  vq: 4,  sq: 3 },
    { name: 'RGB Beast',           price: 3400,  level: 8,  vq: 6,  sq: 5 },
    { name: 'Quantum Station',     price: 16000, level: 13, vq: 8,  sq: 7 },
    { name: 'Prototype X Loop',    price: 90000, level: 20, vq: 10, sq: 9 },
  ]},
  monitor: { name: 'Monitor', icon: 'monitor', tiers: [
    { name: 'Laptop Screen',       price: 0,     level: 1,  vq: 0 },
    { name: '22" Monitor',         price: 110,   level: 1,  vq: 1 },
    { name: '27" QHD Display',     price: 480,   level: 3,  vq: 2 },
    { name: 'Dual Setup',          price: 1600,  level: 6,  vq: 3, sq: 1 },
    { name: 'Ultrawide + Side',    price: 7500,  level: 11, vq: 4, sq: 1 },
    { name: 'Triple Curved',       price: 40000, level: 17, vq: 5, sq: 2 },
  ]},
  camera: { name: 'Camera', icon: 'camera', tiers: [
    { name: 'Built-in Cam',        price: 0,     level: 1,  cq: 0 },
    { name: 'Clip Webcam',         price: 85,    level: 1,  cq: 2 },
    { name: 'HD Streamcam',        price: 420,   level: 3,  cq: 3 },
    { name: 'Mirrorless Camera',   price: 2300,  level: 7,  cq: 5 },
    { name: 'Cinema Camera',       price: 30000, level: 15, cq: 7 },
  ]},
  mic: { name: 'Microphone', icon: 'mic', tiers: [
    { name: 'Earbud Mic',          price: 0,     level: 1,  aq: 0 },
    { name: 'USB Mic',             price: 75,    level: 1,  aq: 2 },
    { name: 'Boom Arm Mic',        price: 360,   level: 3,  aq: 3 },
    { name: 'XLR + Interface',     price: 1900,  level: 7,  aq: 5 },
    { name: 'Broadcast Mic',       price: 18000,  level: 14, aq: 7 },
  ]},
  light: { name: 'Lighting', icon: 'bulb', tiers: [
    { name: 'Ceiling Bulb',        price: 0,     level: 1,  cq: 0 },
    { name: 'Desk Lamp',           price: 40,    level: 1,  cq: 1 },
    { name: 'LED Strip',           price: 160,   level: 2,  cq: 2, vibe: 4 },
    { name: 'Ring Light',          price: 620,   level: 4,  cq: 3, vibe: 4 },
    { name: 'Softbox Kit',         price: 2600,  level: 9,  cq: 5, vibe: 5 },
    { name: 'Smart Studio Rig',    price: 28000, level: 16, cq: 7, vibe: 9 },
  ]},
  chair: { name: 'Chair', icon: 'chair', tiers: [
    { name: 'Wooden Chair',        price: 0,     level: 1,  comfort: 0 },
    { name: 'Office Chair',        price: 120,   level: 1,  comfort: 1 },
    { name: 'Gaming Chair',        price: 560,   level: 4,  comfort: 2, vibe: 2 },
    { name: 'Pro Racing Chair',    price: 2400,  level: 9,  comfort: 3, vibe: 3 },
    { name: 'Ergo Throne',         price: 20000, level: 15, comfort: 4, vibe: 5 },
  ]},
  desk: { name: 'Desk', icon: 'desk', tiers: [
    { name: 'Folding Table',       price: 0,     level: 1,  comfort: 0 },
    { name: 'Wooden Desk',         price: 190,   level: 2,  comfort: 1, vibe: 1 },
    { name: 'L-Shaped Desk',       price: 920,   level: 5,  comfort: 1, vibe: 3 },
    { name: 'RGB Standing Desk',   price: 3900,  level: 10, comfort: 2, vibe: 5 },
    { name: 'Studio Command Desk', price: 35000, level: 18, comfort: 3, vibe: 8 },
  ]},
  keys: { name: 'Keyboard & Mouse', icon: 'keyboard', tiers: [
    { name: 'Membrane Combo',      price: 0,     level: 1,  vq: 0 },
    { name: 'Mech Keyboard',       price: 95,    level: 1,  vq: 1 },
    { name: 'RGB Mech Set',        price: 460,   level: 4,  vq: 1, vibe: 2, sq: 1 },
    { name: 'Pro Esports Set',     price: 5000,  level: 10, vq: 2, vibe: 3, sq: 1 },
  ]},
  net: { name: 'Internet', icon: 'wifi', tiers: [
    { name: 'Basic DSL',           price: 0,     level: 1,  sq: 0 },
    { name: 'Cable 300',           price: 210,   level: 2,  sq: 2 },
    { name: 'Fiber 1G',            price: 1250,  level: 6,  sq: 4 },
    { name: 'Gigabit Pro',         price: 16000,  level: 12, sq: 6 },
  ]},
};
export const GEAR_IDS = Object.keys(GEAR);
