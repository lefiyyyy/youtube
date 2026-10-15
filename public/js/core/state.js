// Persistent game state + save/load (localStorage, mirrored to CrazyGames SDK data when present).
import { GEAR } from '../data/gear.js';
import { wearOf, DEFAULT_WEAR } from '../data/clothes.js';
import { now } from './util.js';
import { SDK } from '../sdk.js';

const KEY = 'streamer-rise-save-v1';
export const SAVE_VERSION = 1;

const NAMES = ['PixelNova', 'LunaPlays', 'ZenoLive', 'ByteBunny', 'NeoNoodle', 'KiraClips', 'MochiMode', 'RioRise', 'JunoJams', 'AstroAce'];

export function freshState() {
  const gear = {};
  for (const k of Object.keys(GEAR)) gear[k] = 0;
  return {
    v: SAVE_VERSION,
    created: now(),
    lastPlayed: now(),
    profile: {
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      gender: 'm', hair: 'swoop', hairColor: '#2b1d16', skin: '#e8b48f', eyes: '#3b2a20', accent: '#ff4f8b',
      wear: { ...DEFAULT_WEAR.m }, col: { top: '#8f6bff', bottom: '#2b2f45', shoes: '#f4f4f6' },
      title: null, badge: null,
    },
    wardrobe: [], // owned brand / reward clothing ids (basics are always owned)
    skills: { gaming: 0, editing: 0, charisma: 0, business: 0 },
    skillPts: 0,
    friends: {}, // npc id -> relationship hearts (0..10)
    outings: { day: 0, party: 0, meet: 0, job: 0 },
    created_char: false,
    tutorial: { step: 0, done: false },
    money: 60, sparks: 5, xp: 0, level: 1,
    needs: { hunger: 80, energy: 90 },
    clock: { day: 1, min: 10 * 60 },
    fans: { vid: 0, pulse: 0, blip: 0, lumo: 0 },
    mood: 70, // community sentiment 0..100
    stats: { videos: 0, streams: 0, posts: 0, views: 0, likes: 0, peakViewers: 0, earned: 0, perfects: 0, donations: 0, clips: 0, meals: 0, sleeps: 0, best: null },
    games: ['blocktopia', 'pixelkart'],
    gameUse: {}, // id -> fatigue 0..1
    gear,
    decor: ['poster_pixel', 'plant_small'], // owned decor ids
    placed: ['poster_pixel', 'plant_small'], // placed decor ids
    theme: 'gamer',
    themes: ['cozy', 'gamer'],
    home: 0,
    homes: [0],
    cosmetics: [], overlay: null, micSkin: null, camSkin: null,
    videos: [], // recent uploads
    clips: 0,
    buffs: {}, // id -> uses
    daily: { lastDay: null, streak: 0 },
    quests: { day: null, list: [], bonus: false },
    events: {}, // key -> {points, claimed:[], tasks:{}}
    reminders: [],
    deals: { offers: [], active: [], done: 0, lastRefresh: 0 },
    inbox: { list: [], lastGen: 0 },
    team: {},
    milestones: [],
    collabs: {},
    lastGear: null,
    trendDay: 0,
    settings: { music: 0.55, sfx: 0.8, quality: 'auto', shake: true },
    seenUnlocks: [],
    history: [], // daily fan snapshots for analytics {d, fans}
  };
}

export const S = { state: freshState() };

function migrate(d) {
  const base = freshState();
  // fashion update: old outfit/accessory fields -> wardrobe slots
  if (d.profile && !d.profile.wear) {
    const p = d.profile;
    p.wear = wearOf(p);
    p.col = { top: p.top || '#8f6bff', bottom: p.bottom || '#2b2f45', shoes: '#f4f4f6' };
    p.gender = ['bob', 'long', 'bun'].includes(p.hair) ? 'f' : 'm';
    d.wardrobe = (d.cosmetics || []).filter((c) => c === 'hoodie_ghost' || c === 'jacket_pixel');
    delete p.outfit; delete p.accessory; delete p.top; delete p.bottom;
  }
  // skill points for levels reached before skills existed
  if (d.level && !d.skills) d.skillPts = (d.level - 1) * 2;
  // shallow-merge missing keys so older saves keep working
  for (const k of Object.keys(base)) if (d[k] === undefined) d[k] = base[k];
  for (const k of Object.keys(base.gear)) if (d.gear[k] === undefined) d.gear[k] = 0;
  for (const k of Object.keys(base.stats)) if (d.stats[k] === undefined) d.stats[k] = base.stats[k];
  for (const k of Object.keys(base.profile)) if (d.profile[k] === undefined) d.profile[k] = base.profile[k];
  for (const k of Object.keys(base.settings)) if (d.settings[k] === undefined) d.settings[k] = base.settings[k];
  // a premiere that was open when the game closed: credit what it earned so far (money was paid live)
  // and let the video keep earning in the background
  for (const v of d.videos || []) {
    if (!v.live) continue;
    d.fans.vid += v.subs || 0;
    d.stats.views += v.views || 0; d.stats.likes += v.likes || 0; d.stats.videos++;
    d.xp += v.pendXp || 0;
    delete v.live; delete v.pendXp;
  }
  d.v = SAVE_VERSION;
  return d;
}

export function load() {
  try {
    if (new URLSearchParams(location.search).has('fresh')) { localStorage.removeItem(KEY); SDK.removeItem(KEY); }
  } catch {}
  // local save and (on CrazyGames) the cloud-synced copy: keep whichever was played last
  const parse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
  let a = null, b = null;
  try { a = parse(localStorage.getItem(KEY)); } catch {}
  b = parse(SDK.getItem(KEY));
  const d = a && b ? ((b.lastPlayed || 0) > (a.lastPlayed || 0) ? b : a) : a || b;
  if (d) {
    try { S.state = migrate(d); return true; } catch (e) { console.warn('Save corrupted, starting fresh', e); }
  }
  S.state = freshState();
  return false;
}

let lastSave = 0;
export function save(force = false) {
  const t = performance.now();
  if (!force && t - lastSave < 1500) return;
  lastSave = t;
  S.state.lastPlayed = now();
  const json = JSON.stringify(S.state);
  try { localStorage.setItem(KEY, json); } catch {}
  SDK.setItem(KEY, json, force);
}
export function wipe() {
  try { localStorage.removeItem(KEY); } catch {}
  try { SDK.removeItem(KEY); } catch {}
  S.state = freshState();
}
