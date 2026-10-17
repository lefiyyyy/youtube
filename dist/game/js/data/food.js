// Food & drinks. hunger/energy are restore amounts (0-100 scale).
export const FOODS = [
  { id: 'snack',    name: 'Crunch Bar',       icon: 'snack',  price: 4,   level: 1,  hunger: 18, energy: 2,  prep: 'grab',   time: 10 },
  { id: 'noodles',  name: 'Instant Noodles',  icon: 'bowl',   price: 7,   level: 1,  hunger: 38, energy: 6,  prep: 'cook',   time: 20 },
  { id: 'volt',     name: 'VoltCan Energy',   icon: 'can',    price: 9,   level: 1,  hunger: 4,  energy: 32, prep: 'grab',   time: 5 },
  { id: 'espresso', name: 'Double Espresso',  icon: 'coffee', price: 3,   level: 1,  hunger: 2,  energy: 24, prep: 'coffee', time: 10, needs: 'coffee' },
  { id: 'pizza',    name: 'Leftover Pizza',   icon: 'pizza',  price: 14,  level: 2,  hunger: 55, energy: 6,  prep: 'cook',   time: 20 },
  { id: 'takeout',  name: 'Ramen Takeout',    icon: 'bowl',   price: 24,  level: 5,  hunger: 70, energy: 12, prep: 'eat',    time: 30, delivery: true },
  { id: 'bowl',     name: 'Power Bowl',       icon: 'leaf',   price: 32,  level: 6,  hunger: 60, energy: 22, prep: 'eat',    time: 30, buff: { id: 'focus', uses: 2 } },
  { id: 'sushi',    name: 'Sushi Platter',    icon: 'fish',   price: 70,  level: 10, hunger: 85, energy: 28, prep: 'eat',    time: 40, delivery: true, buff: { id: 'focus', uses: 3 } },
  { id: 'chef',     name: 'Chef\'s Tasting',  icon: 'crown',  price: 160, level: 15, hunger: 100,energy: 45, prep: 'eat',    time: 45, delivery: true, buff: { id: 'wellfed', uses: 3 } },
];
export const foodById = (id) => FOODS.find((f) => f.id === id);
export const BUFFS = {
  focus:   { name: 'Focused',   desc: '+15% quality', icon: 'target' },
  wellfed: { name: 'Well Fed',  desc: '+25% XP',      icon: 'crown' },
  xp2:     { name: 'XP Boost',  desc: 'Double XP',    icon: 'bolt' },
  trend:   { name: 'Trend Boost', desc: 'Next upload trends', icon: 'flame' },
  announce:{ name: 'Announced', desc: '+35% stream viewers', icon: 'megaphone' },
};
