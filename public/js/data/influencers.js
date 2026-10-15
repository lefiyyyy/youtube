// NPC influencers you meet at parties (the first six are also collab partners in sponsors.js CREATORS).
// Each has a look, a personality, topics they love / hate, and a platform they're big on.
export const TOPICS = ['Gaming', 'Tech', 'Fashion', 'Music', 'Food', 'Memes', 'Fitness', 'Travel', 'Movies', 'Business'];
export const TOPIC_ICONS = { Gaming: 'gamepad', Tech: 'cpu', Fashion: 'shirt', Music: 'music', Food: 'food', Memes: 'laugh', Fitness: 'bolt', Travel: 'map', Movies: 'film', Business: 'dollar' };

const P = (o) => ({ eyes: '#3b2a20', title: null, badge: null, col: { top: o.top || '#ffffff', bottom: o.bottom || '#23253a', shoes: o.shoes || '#f4f4f6' }, ...o });
export const INFLUENCERS = [
  { id: 'luna', name: 'LunaLoops', vibe: 'Cozy streamer', plat: 'Pulse', fans: 1500, likes: ['Food', 'Music'], hates: ['Business'], drip: 8, color: '#ff9fc6',
    profile: P({ gender: 'f', hair: 'long', hairColor: '#3b2a4f', skin: '#f2c7a5', accent: '#ff9fc6', top: '#f7d6e6', bottom: '#e8e4dc', wear: { top: 'sweater', bottom: 'skirt', shoes: 'sneakers', hat: 'catears', eyes: null, neck: 'pearls' } }) },
  { id: 'turbo', name: 'TurboTariq', vibe: 'Racing fanatic', plat: 'Vidora', fans: 6000, likes: ['Tech', 'Gaming'], hates: ['Fashion'], drip: 6, color: '#ffb547',
    profile: P({ gender: 'm', hair: 'spiky', hairColor: '#1d1a1a', skin: '#a8714a', accent: '#ffb547', top: '#ffb547', bottom: '#1d1f2b', wear: { top: 'jacket', bottom: 'joggers', shoes: 'nk_dunk', hat: 'cap', eyes: null, neck: null } }) },
  { id: 'spooky', name: 'SpookySam', vibe: 'Horror gamer', plat: 'Vidora', fans: 20000, likes: ['Movies', 'Memes'], hates: ['Fitness'], drip: 12, color: '#ff5470',
    profile: P({ gender: 'm', hair: 'buzz', hairColor: '#e8e8f0', skin: '#e9b48e', accent: '#ff5470', top: '#1c1c1f', bottom: '#131315', wear: { top: 'st_hoodie', bottom: 'cw_pants', shoes: 'boots', hat: null, eyes: 'glasses', neck: 'gold_chain' } }) },
  { id: 'nia', name: 'NoScopeNia', vibe: 'Pro FPS player', plat: 'Pulse', fans: 70000, likes: ['Gaming', 'Fitness'], hates: ['Food'], drip: 20, color: '#2fd6ff',
    profile: P({ gender: 'f', hair: 'ponytail', hairColor: '#ff4f8b', skin: '#6d4430', accent: '#2fd6ff', top: '#23253a', bottom: '#1d1f2b', wear: { top: 'tech', bottom: 'cw_pants', shoes: 'bl_triple', hat: 'headphones', eyes: null, neck: null } }) },
  { id: 'mika', name: 'MegaMika', vibe: 'Challenge queen', plat: 'Vidora', fans: 250000, likes: ['Travel', 'Memes'], hates: ['Tech'], drip: 26, color: '#9dff5a',
    profile: P({ gender: 'f', hair: 'bun', hairColor: '#f5d36b', skin: '#f5d0b5', accent: '#9dff5a', top: '#f4f2ee', bottom: '#3a4a6b', wear: { top: 'ow_tee', bottom: 'jeans', shoes: 'nk_af1', hat: null, eyes: 'ch_shades', neck: 'ow_belt' } }) },
  { id: 'king', name: 'KingCrafter', vibe: 'Sandbox legend', plat: 'Vidora', fans: 1000000, likes: ['Business', 'Gaming'], hates: ['Memes'], drip: 40, color: '#8f6bff',
    profile: P({ gender: 'm', hair: 'curly', hairColor: '#5a3a22', skin: '#c68a62', accent: '#8f6bff', top: '#0f0f10', bottom: '#2a3550', wear: { top: 'ch_hoodie', bottom: 'ch_jeans', shoes: 'ro_geo', hat: 'ch_trucker', eyes: null, neck: 'ch_cross' } }) },
  // party regulars (not collab partners yet)
  { id: 'vera', name: 'VeraVogue', vibe: 'Fashion vlogger', plat: 'Lumo', fans: 120000, likes: ['Fashion', 'Travel'], hates: ['Gaming'], drip: 45, color: '#ffbe55', party: true,
    profile: P({ gender: 'f', hair: 'bob', hairColor: '#2b1d16', skin: '#d39a6a', accent: '#ffbe55', top: '#1d2b4a', bottom: '#e8e4dc', wear: { top: 'mc_puffer', bottom: 'rl_chino', shoes: 'bl_triple', hat: null, eyes: 'ch_shades', neck: 'pearls' } }) },
  { id: 'dex', name: 'DexReviews', vibe: 'Tech reviewer', plat: 'Vidora', fans: 45000, likes: ['Tech', 'Business'], hates: ['Memes'], drip: 14, color: '#3cc8ff', party: true,
    profile: P({ gender: 'm', hair: 'swoop', hairColor: '#a8683a', skin: '#f7d7c4', accent: '#3cc8ff', top: '#e4dcc0', bottom: '#2b2f45', wear: { top: 'si_crew', bottom: 'rl_chino', shoes: 'nk_dunk', hat: null, eyes: 'glasses', neck: null } }) },
  { id: 'kiko', name: 'KikoDance', vibe: 'Blip dance star', plat: 'Blip', fans: 300000, likes: ['Music', 'Fitness'], hates: ['Business'], drip: 30, color: '#ff4d6d', party: true,
    profile: P({ gender: 'f', hair: 'ponytail', hairColor: '#7b6bff', skin: '#e8b48f', accent: '#ff4d6d', top: '#ff4f8b', bottom: '#1d1f2b', wear: { top: 'crop', bottom: 'ro_cargo', shoes: 'ro_geo', hat: null, eyes: null, neck: 'gold_chain' } }) },
];
export const influencerById = (id) => INFLUENCERS.find((x) => x.id === id);
export const npcProfile = (id) => { const x = influencerById(id); return x ? { name: x.name, ...x.profile } : null; };

// Small talk lines
export const LINES = {
  greet: ['Oh hey! Love your channel', 'Wait, you\'re {me}, right?', 'Heyy, finally we meet!', 'Yo! Great party huh', 'Hi! Did you just get here?'],
  like: ['Okay you GET it', 'Finally someone who gets it!', 'Haha yes, exactly!', 'We should talk more often', 'This is my favorite topic!'],
  meh: ['Hm, interesting', 'Yeah, I guess', 'Sure, sure', 'Cool cool'],
  hate: ['Ugh... not really my thing', 'Can we talk about something else?', 'Yikes, hard pass'],
  fit: ['That fit is insane', 'Okay the drip is real', 'Where did you get that?!'],
  fitMeh: ['Cute outfit', 'Nice hoodie!', 'Comfy look, I like it'],
  selfie: ['Say cheese!', 'Posting this right now', 'Tag me!'],
  collabYes: ['Let\'s do it! DM me', 'A collab? I\'m in!', 'Our audiences would love that'],
  collabNo: ['Maybe later — get to know me first', 'Let\'s hang out more first', 'Hmm, not yet'],
};
