// Video comment generator for uploads (premiere feed + Studio). Tokens: {g} game, {n} creator name.
const POS = ['this is so underrated', 'the editing on this :fire:', 'subbed instantly', 'how does this only have {v} views', 'best {g} video on Vidora', '{n} never misses', 'watched this twice lol', 'the ending got me :lul:', 'algorithm finally did something right', 'I needed this today :heart:', 'quality keeps going up', 'peak content', 'can we get a part 2??', 'the thumbnail made me click and I don\'t regret it', 'love the vibe of this channel'];
const MID = ['first!', 'nice video', 'what\'s your setup?', 'who\'s here in {y}', 'more {g} pls', 'early gang', 'the music in the background tho', 'I came from Blip', 'notification squad', 'what game should be next?'];
const NEG = ['audio could be better', 'kinda slow in the middle', 'clickbait title :sad:', 'mid tbh', 'the mic is crunchy', 'upload more consistently'];
const FUNNY = ['the blooper at 3:12 :lul:', 'I can\'t stop laughing :skull:', 'bro was NOT ready', 'the reaction is everything :lul:'];
const PRO = ['the color grade on this', 'cinematic af', 'the sound design :cool:', 'this looks like TV'];
const NAMES_A = ['pixel', 'cozy', 'turbo', 'glitch', 'mochi', 'neon', 'lofi', 'sleepy', 'crispy', 'void', 'boba', 'retro', 'frost', 'lucky', 'byte', 'moon', 'nova', 'zen', 'hyper', 'ghost'];
const NAMES_B = ['Panda', 'Fox', 'Wizard', 'Bean', 'Toast', 'Duck', 'Ninja', 'Otter', 'Pilot', 'Frog', 'Dino', 'Taco', 'Cat', 'Comet', 'Noodle'];
export const commenter = () => NAMES_A[Math.floor(Math.random() * NAMES_A.length)] + NAMES_B[Math.floor(Math.random() * NAMES_B.length)] + (Math.random() < 0.4 ? Math.floor(Math.random() * 99) : '');

export function makeComment({ quality = 0.7, trust = 1, game = 'this game', name = 'you', views = 0, type = 'gameplay', edit = 'clean' }) {
  const r = Math.random();
  let pool = MID;
  if (r < 0.12 + (1 - trust) * 0.5 + (quality < 0.55 ? 0.15 : 0)) pool = NEG;
  else if (r < 0.7) pool = type === 'funny' && Math.random() < 0.4 ? FUNNY : edit === 'pro' && Math.random() < 0.35 ? PRO : POS;
  const t = pool[Math.floor(Math.random() * pool.length)];
  return {
    user: commenter(), neg: pool === NEG,
    text: t.replace('{g}', game).replace('{n}', name).replace('{v}', views < 1000 ? String(views) : Math.round(views / 1000) + 'K').replace('{y}', String(2026)),
    likes: Math.floor(Math.random() * Math.max(3, views * 0.002)),
  };
}
