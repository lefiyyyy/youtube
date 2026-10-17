// Live chat content. Emote tokens like :pog: are rendered as custom inline emotes.
const A = ['pixel', 'noScope', 'cozy', 'turbo', 'glitch', 'mochi', 'neon', 'lofi', 'sleepy', 'crispy', 'tiny', 'mega', 'void', 'salty', 'boba', 'retro', 'frost', 'lucky', 'chonky', 'byte', 'spicy', 'moon', 'nova', 'rad', 'zen', 'hyper', 'fluffy', 'ghost', 'cyber', 'waffle'];
const B = ['Panda', 'Nana', 'Crumb', 'Tariq', 'Gremlin', 'Fox', 'Wizard', 'Bean', 'Toast', 'Kid', 'Duck', 'Ninja', 'Otter', 'Pilot', 'Queen', 'Bun', 'Frog', 'Mage', 'Moth', 'Dino', 'Yeti', 'Taco', 'Raccoon', 'Sprout', 'Cat', 'Comet', 'Noodle', 'Bard', 'Golem', 'Pixie'];
const C = ['', '', '', '42', '_tv', '99', 'xd', '_', '7', 'gg', '2k', '_live', '01', 'ii', 'zz'];
export function randomUser() {
  const a = A[Math.floor(Math.random() * A.length)], b = B[Math.floor(Math.random() * B.length)], c = C[Math.floor(Math.random() * C.length)];
  const style = Math.random();
  if (style < 0.33) return (a + b + c).toLowerCase();
  if (style < 0.66) return a.charAt(0).toUpperCase() + a.slice(1) + b + c;
  return a + '_' + b.toLowerCase() + c;
}
export const USER_COLORS = ['#ff6b9a', '#ffb547', '#9dff5a', '#2fd6ff', '#b48cff', '#ff8a5c', '#5effc3', '#ffe066', '#7aa2ff', '#ff5d5d'];

export const LINES = {
  hello: ['hiii :heart:', 'yo chat', 'just got here!', 'hello from Brazil', 'first time here :pog:', 'evening everyone', 'whats up {name}', 'hey hey', 'lurking :cool:', 'back again lol', 'hi from the clip!'],
  generic: ['vibes :cool:', 'this is so chill', 'love the energy', 'lol', 'W streamer', 'whats the plan today?', 'chat is cozy today', 'no way', 'real', 'this music slaps', 'hydrate check', ':clap: :clap:', 'how long you been streaming?', 'gaming time', 'lets gooo', 'locked in :fire:', 'peak content', 'POV: im procrastinating', 'staying till the end'],
  hype: ['W', 'WWWW', 'LETS GOOOO :fire:', 'CLIP IT :pog:', 'NO WAY :pog:', 'INSANE', 'HYPE HYPE :fire:', 'cracked :fire:', 'GG :gg:', 'BIG PLAY', '{pr} did it :pog:', 'actually goated', 'that was clean', ':pog: :pog: :pog:', 'chat did you see that'],
  fail: ['L', 'lmaooo :lul:', 'skill issue :lul:', 'F', 'unlucky', 'nooo :sad:', 'bro tripped :lul:', 'that was rough', 'its ok we move', 'lol :skull:', 'NOT LIKE THIS :sad:', 'pain'],
  question: ['whats your setup?', 'favorite game ever?', 'when is the next video?', 'can you say hi to me?', 'how do you edit your vids?', 'what mic is that?', 'do you play with viewers?', 'tips for new streamers?'],
  troll: ['this stream is mid', 'ur bad lol', 'boring :sad:', 'unsub', 'go play something good', 'cringe', 'zzz'],
  donation: ['keep it up!', 'for the snacks', 'buy a better mic lol', 'love the content :heart:', 'first donation ever!', 'you deserve more viewers', 'for the grind :fire:', 'pizza money'],
  subs: ['just subbed! :heart:', '3 months!!', 'new member :pog:', 'take my sub', 'resubbed :cool:'],
  // context reactions
  lowMic: ['mic sounds muffled', 'cant hear you well', 'audio kinda crunchy lol', 'get a real mic :lul:'],
  lowCam: ['cam is potato lol', 'upgrade the cam pls :sad:', '240p vibes :lul:'],
  lowNet: ['lag?', 'buffering...', 'stream froze for me', 'internet speed: snail :lul:'],
  dark: ['its so dark in there', 'turn on a light lol', 'cave stream :skull:'],
  goodGear: ['the setup is CLEAN', 'audio is so crisp :cool:', 'that RGB tho :fire:', 'production value insane', 'camera quality :pog:'],
  newGear: ['NEW SETUP?? :pog:', 'ooh new gear', 'sounds way better now', 'glow up arc :fire:'],
  tired: ['you look sleepy lol', 'get some rest :heart:', 'yawn count: 3', 'eyes closing :skull:', 'go to bed lol'],
  hungry: ['eat something lol', 'stomach growling on mic :lul:', 'snack break?', 'feed the streamer'],
  viral: ['came from the clip!', 'the clip is everywhere :fire:', 'youre blowing up', 'algorithm sent me :pog:'],
  cat: ['CAT :cat:', 'KITTY :heart:', 'cat cam when', 'the cat is the real streamer :cat:'],
  trend: ['this game is trending rn', 'everyone is playing this', 'perfect timing :fire:'],
  event: ['event hype :fire:', 'grinding the event with you', 'event rewards look sick'],
  hypeTrain: ['HYPE TRAIN :fire: :fire:', 'CHOO CHOO :pog:', 'ALL ABOARD', 'TRAIN TRAIN TRAIN'],
  raid: ['RAID :pog:', 'raiders in the house', 'hi from the raid :heart:', 'we came in peace'],
  poll: ['1', '2', '1!!', 'option 2 obviously', '2 2 2', '1 for sure'],
  genre: {
    horror: ['dont open that door', 'BEHIND YOU', 'im scared for you :sad:', 'jumpscare incoming', 'nope nope nope', 'lights on pls :skull:'],
    racing: ['drift {king} :fire:', 'that corner tho', 'turbo time', 'pit stop?', 'speedy', 'clean line'],
    shooter: ['headshot!!', 'aim is crazy :pog:', 'reload!!', 'flank left', 'one tap', 'clutch or kick'],
    sandbox: ['build a castle', 'this build is huge', 'add a moat lol', 'mining time', 'creative mode when'],
    cozy: ['so relaxing :heart:', 'name the cow', 'comfy stream :cool:', 'water the crops', 'healing my soul'],
    challenge: ['you got this', 'rage incoming :lul:', 'one more try', 'pain arc', 'never giving up :fire:'],
    retro: ['nostalgia :heart:', 'old school :cool:', 'pixels hit different', 'childhood unlocked'],
    multiplayer: ['can i join?', 'squad up', 'invite me pls', 'teammate diff :lul:'],
    sports: ['GOOOAL :fire:', 'pass it!!', 'top bins :pog:', 'ref is blind lol', 'that keeper tho', 'man of the match'],
    fighting: ['combo it!', 'block block BLOCK', 'frame perfect :pog:', 'hes spamming lol', 'parry god', 'run it back'],
    rhythm: ['the beat goes hard :fire:', 'full combo pls', 'hands are cracked :pog:', 'missed one :sad:', 'this song slaps', 'perfect perfect perfect'],
    puzzle: ['rotate it!', 'hold the long one', 'galaxy brain :cool:', 'set up the combo', 'the stack is scary', 'so satisfying :heart:'],
    strategy: ['big brain play :cool:', 'save your mana', 'go face!', 'that was a misplay lol', 'trade it', '200 iq :pog:'],
  },
};
export const EMOTES = ['pog', 'lul', 'fire', 'heart', 'gg', 'skull', 'clap', 'sad', 'cool', 'cat', 'w'];

export const STREAM_QUESTIONS = [
  { q: 'whats your setup?', a: ['Show it off', 'Still building it'] },
  { q: 'favorite game ever?', a: ['This one!', 'Too hard to pick'] },
  { q: 'can you say hi to me?', a: ['Hi friend!', 'Wave'] },
  { q: 'tips for new streamers?', a: ['Be consistent', 'Have fun'] },
  { q: 'when is the next video?', a: ['Tomorrow!', 'Surprise drop'] },
  { q: 'do you play with viewers?', a: ['Next stream!', 'Maybe soon'] },
];
export const POLLS = [
  ['Next game?', 'Horror', 'Cozy'],
  ['Hard mode?', 'YES', 'no thanks'],
  ['Snack break?', 'Pizza', 'Noodles'],
  ['Collab soon?', 'Yes!', 'Solo forever'],
];

// Social replies & inbox
export const SOCIAL_REPLIES = ['this is so you :heart:', 'W post', 'cant wait!!', 'lmao', 'the setup glow up :fire:', 'notifications ON', 'iconic', 'goated', 'ok but the lighting :pog:', 'saving this', 'hiii', 'first!!'];
export const INBOX = [
  { from: 'fan', text: 'Your videos got me through exams. Thank you!', replies: [['Heartfelt', 'heart', 1.0], ['Funny', 'laugh', 0.8]] },
  { from: 'fan', text: 'Can you play more horror games??', replies: [['On it!', 'ghost', 1.0], ['Maybe later', 'clock', 0.6]] },
  { from: 'hater', text: 'You only got lucky with the algorithm.', replies: [['Stay classy', 'sparkle', 1.0], ['Clap back', 'zap', 0.4]] },
  { from: 'fan', text: 'I started streaming because of you!', replies: [['So proud!', 'heart', 1.0], ['Send link', 'link', 0.9]] },
  { from: 'fan', text: 'Your setup is my dream setup.', replies: [['Thank you!', 'heart', 1.0], ['Tour soon?', 'film', 0.9]] },
  { from: 'brand', text: 'Hey! Love your vibe. Open to a collab later?', replies: [['Absolutely', 'handshake', 1.0], ['Busy rn', 'clock', 0.5]] },
  { from: 'fan', text: 'What time do you usually stream?', replies: [['Evenings!', 'moon', 1.0], ['Random lol', 'laugh', 0.7]] },
  { from: 'hater', text: 'Your mic sounds like a potato.', replies: [['Upgrading!', 'mic', 1.0], ['Ignore', 'x', 0.5]] },
  { from: 'fan', text: 'Made fan art of you! (attached)', replies: [['Love it!!', 'heart', 1.0], ['Pin it', 'star', 1.0]] },
];
