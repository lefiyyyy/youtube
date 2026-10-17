// Daily login calendar: 7-day cycle, weekly rotating exclusive.
export const WEEKLY_EXCLUSIVE = ['neon_cat', 'lava_lamp', 'holo_plant', 'crt_tv'];
export function dailyCalendar(week, level) {
  const cash = (m) => Math.round((120 + level * 60) * m / 10) * 10;
  const excl = WEEKLY_EXCLUSIVE[week % WEEKLY_EXCLUSIVE.length];
  return [
    { day: 1, kind: 'money',   label: 'Starter Cash',    amount: cash(1), icon: 'dollar' },
    { day: 2, kind: 'buff',    label: 'Double XP',       buff: 'xp2', uses: 3, icon: 'bolt', sub: '3 uploads' },
    { day: 3, kind: 'sparks',  label: 'Sparks',          amount: 15, icon: 'spark' },
    { day: 4, kind: 'decor',   label: 'Exclusive Decor', item: excl, icon: 'paint', rare: true },
    { day: 5, kind: 'buff',    label: 'Trend Boost',     buff: 'trend', uses: 1, icon: 'flame', sub: 'Next upload trends' },
    { day: 6, kind: 'cosmetic',label: 'Overlay Pack',    item: ['overlay_neon', 'overlay_sunset', 'overlay_mono', 'overlay_holo'][week % 4], icon: 'layers' },
    { day: 7, kind: 'mega',    label: 'Golden Week Box', amount: cash(4), sparks: 40, item: week % 2 === 0 ? 'golden_mic' : 'thumb_pack', icon: 'crown', rare: true },
  ];
}
// Cosmetics catalog (overlays, skins, titles, badges)
export const COSMETICS = {
  overlay_neon:   { name: 'Neon Overlay',     type: 'overlay', colors: ['#ff4f8b', '#2fd6ff'] },
  overlay_sunset: { name: 'Sunset Overlay',   type: 'overlay', colors: ['#ff9f43', '#ff4f8b'] },
  overlay_mono:   { name: 'Mono Overlay',     type: 'overlay', colors: ['#ffffff', '#9aa0b5'] },
  overlay_holo:   { name: 'Holo Overlay',     type: 'overlay', colors: ['#9dff5a', '#8f6bff'] },
  overlay_rush:   { name: 'Rush Overlay',     type: 'overlay', colors: ['#ffcf4a', '#ff5d5d'] },
  overlay_spooky: { name: 'Spooky Overlay',   type: 'overlay', colors: ['#ff8a3d', '#9b5cff'] },
  golden_mic:     { name: 'Golden Mic Skin',  type: 'skin' },
  crt_cam:        { name: 'Retro Cam Skin',   type: 'skin' },
  thumb_pack:     { name: 'Neon Pro Thumbnails', type: 'thumbs' },
  hoodie_ghost:   { name: 'Ghost Hoodie',     type: 'outfit' },
  jacket_pixel:   { name: 'Pixel Jacket',     type: 'outfit' },
  title_pixel:    { name: '"Pixel Pro" Title',type: 'title', text: 'Pixel Pro' },
  title_night:    { name: '"Night Owl" Title',type: 'title', text: 'Night Owl' },
  title_rush:     { name: '"Rush Hour" Title',type: 'title', text: 'Rush Hour' },
  title_icon:     { name: '"Award Winner" Title', type: 'title', text: 'Award Winner' },
  title_deal:     { name: '"Brand Icon" Title', type: 'title', text: 'Brand Icon' },
  title_collab:   { name: '"Team Player" Title', type: 'title', text: 'Team Player' },
  badge_retro:    { name: 'Retro Fest Badge', type: 'badge', color: '#38d6f5' },
  badge_horror:   { name: 'Horror Week Badge',type: 'badge', color: '#ff5470' },
  badge_rush:     { name: 'Stream Rush Badge',type: 'badge', color: '#ffb547' },
  badge_awards:   { name: 'Awards Badge',     type: 'badge', color: '#ffcf4a' },
  badge_sponsor:  { name: 'Sponsor Badge',    type: 'badge', color: '#4fd37b' },
  badge_collab:   { name: 'Collab Badge',     type: 'badge', color: '#b48cff' },
};
