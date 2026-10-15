// Café Shift: a ~40 s barista part-time job minigame (YouTubers Life style).
// Job.shift({ difficulty = 0.3, wage = 14 }) resolves with { orders, perfect, tips, pay } when the player
// collects; the caller pays out. Mouse/touch, keys (1-6, Enter, Backspace) and window.__autoplay supported.
import { G } from '../game/ctx.js';
import { $, $$, h, bind, ic, floatText, countUp } from '../ui/ui.js';
import { overlay, closeOverlay } from './create.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SV = (d) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
// Ingredients in key order 1-6: c/c2 = layer colours, ink = glyph colour on the swatch
const ING = {
  esp: { name: 'Espresso', c: '#8a5534', c2: '#3d2316', ink: '#fff3e6', g: ic('coffee'), sfx: 'pop' },
  milk: { name: 'Milk', c: '#f6efe2', c2: '#d6c3a2', ink: '#5a4630', g: SV('<path d="M8 8.5 9.5 3.5h5L16 8.5v11a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19.5zM8 8.5h8M8 13h8"/>'), sfx: 'pop' },
  ice: { name: 'Ice', c: '#e2f6fd', c2: '#7fc8e6', ink: '#15485c', g: ic('cube'), sfx: 'tab' },
  car: { name: 'Caramel', c: '#f2b05a', c2: '#b4641a', ink: '#3d1f00', g: SV('<path d="M12 3.5c3.2 4.2 5.5 7.2 5.5 10.2a5.5 5.5 0 0 1-11 0c0-3 2.3-6 5.5-10.2z"/><path d="M9.5 14.2a2.6 2.6 0 0 0 2.5 2.4"/>'), sfx: 'pop' },
  mat: { name: 'Matcha', c: '#a9d47f', c2: '#55913a', ink: '#163008', g: ic('leaf'), sfx: 'pop' },
  foam: { name: 'Foam', c: '#fffbf5', c2: '#dccdb4', ink: '#5b4a38', g: SV('<path d="M7 18.5a3.8 3.8 0 0 1-.6-7.6 5.6 5.6 0 0 1 10.8-1.3 3.9 3.9 0 0 1 .3 8.9z"/><path d="M10 14.5h.01M14 13h.01"/>'), sfx: 'pop' },
};
const KEYS = Object.keys(ING);
const MENU = [
  ['Latte', 'esp milk'], ['Double Shot', 'esp esp'], ['Iced Americano', 'ice esp'], ['Matcha Latte', 'mat milk'],
  ['Cappuccino', 'esp milk foam'], ['Iced Latte', 'ice esp milk'], ['Caramel Latte', 'esp car milk'], ['Dirty Matcha', 'mat milk esp'],
  ['Matcha Cloud', 'mat milk foam'], ['Iced Matcha', 'ice mat milk'], ['Caramel Cortado', 'car esp milk'],
  ['Caramel Macchiato', 'car milk esp foam'], ['Iced Caramel Latte', 'ice esp car milk'], ['Matcha Frappé', 'ice mat car foam'], ['Cloud Latte', 'esp milk car foam'],
].map(([name, r]) => ({ name, r: r.split(' ') }));

// ---- customers: little bust portraits drawn as inline SVG
const NAMES = ['Maya', 'Leo', 'Priya', 'Sam', 'Noah', 'Zoe', 'Kai', 'Ines', 'Theo', 'Ava', 'Omar', 'Lena', 'Jun', 'Rosa', 'Eli', 'Nia', 'Hugo', 'Mei'];
const SKIN = ['#f6d7bf', '#ebbd98', '#d39b74', '#a9724d', '#7b4c31'];
const HAIR = ['#2a1d17', '#5b3a22', '#b7793a', '#e3c27e', '#8e3030', '#23222e', '#d9d7e0'];
const TOPS = ['#ff6b81', '#3cc8ff', '#8ee05a', '#ffbe55', '#9b8cff', '#ff9f43', '#4fd1b0', '#e3e5ec'];
const FRINGE = 'M17.5 26c0-8.5 5.5-13.5 12.5-13.5S42.5 17.5 42.5 26c-2.5-3.5-7-5.5-12.5-5.5S20 22.5 17.5 26z';
const STYLES = [ // [behind head, over head]
  (c) => ['', `<path d="${FRINGE}" fill="${c}"/>`],
  (c) => ['', `<circle cx="30" cy="11.5" r="5.5" fill="${c}"/><path d="${FRINGE}" fill="${c}"/>`],
  (c) => [`<path d="M16.5 28c0-10 6-15.5 13.5-15.5S43.5 18 43.5 28v16h-7V30h-13v14h-7z" fill="${c}"/>`, `<path d="${FRINGE}" fill="${c}"/>`],
  (c) => [`<circle cx="30" cy="22.5" r="16.5" fill="${c}"/>`, ''],
  (c, t) => ['', `<path d="M17 25.5a13 13 0 0 1 26 0z" fill="${t}"/><path d="M17 25.5a13 13 0 0 1 26 0z" fill="#0004"/><path d="M39 23.8h8.5a1.8 1.8 0 0 1 0 3.6H39z" fill="${t}"/>`],
];
const MOUTH = {
  happy: '<path d="M26 32.2q4 3.6 8 0"/><circle cx="22.6" cy="31.4" r="1.9" fill="#ff7a7a" stroke="none" opacity=".35"/><circle cx="37.4" cy="31.4" r="1.9" fill="#ff7a7a" stroke="none" opacity=".35"/>',
  ok: '<path d="M26.6 33.2h6.8"/>',
  mad: '<path d="M26 34.6q4-3.2 8 0"/><path d="M22.8 23.6l4.4 1.4M37.2 23.6l-4.4 1.4"/>',
};
function bust() {
  const skin = pick(SKIN), top = pick(TOPS), [back, front] = pick(STYLES)(pick(HAIR), top);
  return { top, svg: `<svg viewBox="0 0 60 60" aria-hidden="true">${back}<path d="M8 62c0-11.5 9.5-18.5 22-18.5S52 50.5 52 62z" fill="${top}"/><path d="M25 44q5 4 10 0" stroke="#0003" stroke-width="1.6" fill="none"/>
    <rect x="26" y="35" width="8" height="10" rx="3" fill="${skin}"/><circle cx="30" cy="27" r="12.5" fill="${skin}"/>${front}
    <circle cx="25.6" cy="27.8" r="1.6" fill="#231a1c"/><circle cx="34.4" cy="27.8" r="1.6" fill="#231a1c"/>
    <g class="mo" fill="none" stroke="#3a2420" stroke-width="1.6" stroke-linecap="round">${MOUTH.happy}</g></svg>` };
}

export const Job = {
  async shift(opts = {}) {
    const diff = Math.max(0, Math.min(1, opts.difficulty ?? 0.3)), wage = opts.wage ?? 14;
    const DUR = 40, CAP = 4, MAXQ = 4;
    const A = (n, v) => G.audio?.sfx(n, v);
    const charm = 1 + (G.s?.skills?.charisma || 0) * 0.03;
    const touch = matchMedia('(pointer: coarse)').matches;
    const el = overlay(`<div class="jb-card glass">
      <div class="jb-head">
        <div class="jb-badge">${ic('coffee')}</div>
        <div class="jb-ttl"><b>Café Shift</b><small>Part-time job · The Daily Grind</small></div>
        <div class="grow"></div>
        <span class="chip jb-streak">${ic('flame')}Streak <b>0</b></span>
        <div class="jb-earn">${ic('dollar')}<b>0</b></div>
        <div class="jb-time"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15.5"/><circle class="fg" cx="18" cy="18" r="15.5" pathLength="100" stroke-dasharray="100"/></svg><b>${DUR}</b></div>
        <button class="xbtn" data-a="end" title="End shift">${ic('close')}</button>
      </div>
      <div class="jb-queue"><div class="jb-jar"><div class="jar"><i class="jf"></i></div><div><small>Tip jar</small><b>$0</b></div></div></div>
      <div class="jb-main">
        <div class="jb-ticket"></div>
        <div class="jb-mid">
          <div class="jb-stage"><div class="jb-msg"></div><i class="jb-pour"></i>
            <div class="jb-cup"><div class="jb-fill"></div><svg class="jb-glass" viewBox="0 0 100 128" preserveAspectRatio="none"><path class="gl" d="M4 6h92l-10.6 117a3.5 3.5 0 0 1-3.5 3H18.1a3.5 3.5 0 0 1-3.5-3z"/><path class="hl" d="M13 18l6 92"/></svg></div></div>
          <div class="jb-acts"><button class="btn ghost" data-a="clear" data-silent="1">${ic('undo')}Clear</button><button class="btn go" data-a="serve" data-silent="1">${ic('check')}Serve</button></div>
        </div>
        <div class="jb-ings">${KEYS.map((k, i) => `<button class="jb-ing" data-a="add" data-k="${k}" data-silent="1" style="--c:${ING[k].c};--c2:${ING[k].c2};--ink:${ING[k].ink}"><kbd>${i + 1}</kbd><span class="sw">${ING[k].g}</span><b>${ING[k].name}</b></button>`).join('')}</div>
      </div>
      <div class="jb-intro" data-a="start"><div class="ji-card">
        <div class="ji-k">Part-time job</div><h2 class="display">Café Shift</h2><p>Serve as many drinks as you can in ${DUR} seconds.</p>
        <div class="ji-steps">
          <div><span>${ic('ticket')}</span><b>Read the ticket</b><small>Every drink has a recipe</small></div>
          <div><span>${ic('layers')}</span><b>Add in order</b><small>Bottom layer first</small></div>
          <div><span>${ic('clock')}</span><b>Serve fast</b><small>Happy customers tip more</small></div>
        </div>
        <button class="btn primary big">${ic('play')}Start shift</button>
        <div class="ji-auto"><i></i></div>
        ${touch ? '' : '<div class="ji-keys"><kbd>1</kbd>–<kbd>6</kbd> add · <kbd>Enter</kbd> serve · <kbd>Backspace</kbd> clear</div>'}
      </div></div>
    </div>`, 'job');
    const q = (s) => $(s, el);
    const card = q('.jb-card');
    const R = { queue: q('.jb-queue'), ticket: q('.jb-ticket'), stage: q('.jb-stage'), cup: q('.jb-cup'), fill: q('.jb-fill'), msg: q('.jb-msg'), pour: q('.jb-pour'),
      ring: q('.jb-time .fg'), time: q('.jb-time b'), timeW: q('.jb-time'), streak: q('.jb-streak'), earn: q('.jb-earn b'), jarV: q('.jb-jar b'), jarF: q('.jb-jar .jf'), serve: q('[data-a=serve]') };
    const S = { t: 0, phase: 'intro', line: [], cup: [], bad: false, slip: false, next: 0.35, n: 0, orders: 0, perfect: 0, tips: 0, pay: 0, streak: 0, best: 0, missed: 0, wrong: 0, bot: 0.4, tick: 0, shown: null };
    const front = () => S.line[0];
    const restart = (e, c) => { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); };
    el.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus off buttons so Enter never double-fires

    // ---- rendering
    const hud = () => {
      R.earn.textContent = S.pay; R.jarV.textContent = '$' + S.tips;
      R.jarF.style.height = Math.min(92, (S.tips / (wage * 4)) * 100) + '%';
      $('b', R.streak).textContent = S.streak;
      R.streak.classList.toggle('on', S.streak >= 2);
    };
    const marks = () => {
      const c = front();
      $$('.jb-ing', el).forEach((b) => b.classList.toggle('hint', !!c && c.id === 1 && !S.bad && b.dataset.k === c.order.r[S.cup.length]));
      if (!c) return;
      $$('.tk-steps li', R.ticket).forEach((li, i) => {
        const k = S.cup[i], bad = k !== undefined && k !== c.order.r[i];
        li.className = bad ? 'bad' : k ? 'done' : i === S.cup.length && !S.bad ? 'next' : '';
        $('.st', li).innerHTML = bad ? ic('close') : k ? ic('check') : '';
      });
      R.serve.classList.toggle('ready', !S.bad && S.cup.length === c.order.r.length);
    };
    const renderTicket = () => {
      const c = front();
      R.ticket.classList.toggle('empty', !c);
      R.ticket.innerHTML = !c ? `<div class="jb-wait">${ic('hourglass')}<b>Waiting for customers</b></div>`
        : `<div class="tk-top"><span>Order #${String(c.id).padStart(2, '0')}</span><span>${c.name}</span></div><div class="tk-name">${c.order.name}</div>
        <ol class="tk-steps">${c.order.r.map((k, i) => `<li><em>${i + 1}</em><span class="sw" style="--c:${ING[k].c};--c2:${ING[k].c2}"></span><b>${ING[k].name}</b><span class="st"></span></li>`).join('')}</ol>
        <div class="tk-foot">${ic('coin')}$${wage} + tips</div>`;
      if (c) restart(R.ticket, 'in');
      marks();
    };
    const renderCup = (fresh) => {
      R.fill.innerHTML = S.cup.map((k, i) => `<i class="jb-l ${k} ${fresh && i === S.cup.length - 1 ? 'new' : ''}" style="--c:${ING[k].c};--c2:${ING[k].c2}"></i>`).join('');
      R.cup.classList.toggle('wrong', S.bad);
      R.msg.innerHTML = S.bad ? `${ic('info')}Wrong ingredient · clear the cup` : '';
      marks();
    };
    const layout = () => {
      S.line.forEach((c, i) => { c.el.style.setProperty('--i', i); c.el.classList.toggle('front', i === 0); });
      if (front() !== S.shown) { S.shown = front(); S.cup = []; S.bad = S.slip = false; renderCup(); renderTicket(); }
    };
    const ghost = (kind) => { // a copy of the cup animates away so the real one resets instantly
      if (!S.cup.length) return;
      const g = R.cup.cloneNode(true); g.classList.add('jb-ghost', kind);
      R.stage.appendChild(g); setTimeout(() => g.remove(), 650);
    };
    const nope = (msg) => { A('error'); restart(R.cup, 'shake'); if (!S.bad) { R.msg.innerHTML = `${ic('info')}${msg}`; clearTimeout(S.msgT); S.msgT = setTimeout(() => !S.bad && (R.msg.innerHTML = ''), 1200); } };
    const cupPoint = () => { const r = R.cup.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.2 }; };

    // ---- customers
    const setMood = (c, m) => { if (c.mood !== m) { c.mood = m; $('.mo', c.el).innerHTML = MOUTH[m]; } };
    const spawn = () => {
      const prog = S.t / DUR;
      const len = S.n === 0 ? 2 : Math.min(4, 2 + (prog > 0.2 || diff > 0.45 ? 1 : 0) + (prog > 0.5 && diff > 0.15 ? 1 : 0));
      const order = pick(MENU.filter((m) => m.r.length <= len && m.r.length >= len - 1));
      const taken = S.line.map((c) => c.name), look = bust();
      const c = { id: ++S.n, name: pick(NAMES.filter((n) => !taken.includes(n))), order, p: 1, dur: 13 - 5 * diff + 1.3 * order.r.length, mood: 'happy' };
      c.el = h(`<div class="jb-c" style="--i:${S.line.length}"><div class="jb-av" style="--tc:${look.top}">${look.svg}</div><span class="jb-nm">${c.name}</span><div class="jb-pat"><i></i></div></div>`);
      c.bar = $('.jb-pat', c.el);
      R.queue.appendChild(c.el); S.line.push(c);
      if (S.n === 1) A('doorbell', 0.6);
      layout();
    };
    const leave = (c, kind, say) => {
      S.line.splice(S.line.indexOf(c), 1);
      setMood(c, kind === 'happy' ? 'happy' : 'mad');
      if (say) c.el.insertAdjacentHTML('beforeend', `<span class="jb-say ${kind}">${say}</span>`);
      c.el.classList.add('out', kind);
      setTimeout(() => c.el.remove(), 950);
      if (!S.line.length) S.next = Math.min(S.next, S.t + 0.6);
      layout();
    };

    // ---- player actions
    const add = (k) => {
      if (S.phase !== 'play') return;
      const c = front(), btn = q(`.jb-ing[data-k=${k}]`);
      restart(btn, 'hit');
      if (!c) return nope('No order yet');
      if (S.cup.length >= CAP) return nope('The cup is full');
      S.cup.push(k);
      if (c.order.r[S.cup.length - 1] !== k) { S.bad = S.slip = true; A('miss'); } else A(ING[k].sfx, 0.9);
      R.pour.style.setProperty('--c', ING[k].c); R.pour.style.setProperty('--c2', ING[k].c2); restart(R.pour, 'go');
      renderCup(true);
    };
    const clear = () => {
      if (S.phase !== 'play' || !S.cup.length) return;
      ghost('dump'); A('whoosh');
      S.cup = []; S.bad = false; renderCup();
    };
    const serve = () => {
      if (S.phase !== 'play') return;
      const c = front();
      if (!c || !S.cup.length) return nope(c ? 'Add the ingredients first' : 'No order yet');
      const ok = !S.bad && S.cup.length === c.order.r.length, pt = cupPoint();
      ghost(ok ? 'up' : 'dump');
      if (ok) {
        S.streak++; S.best = Math.max(S.best, S.streak);
        const perfect = !S.slip && c.p >= 0.5;
        const tip = Math.round(wage * (0.12 + 0.6 * c.p) * (1 + 0.08 * Math.min(S.streak - 1, 6)) * charm);
        S.orders++; S.perfect += perfect ? 1 : 0; S.tips += tip; S.pay += wage + tip;
        A('cash'); if (perfect) A('perfect');
        floatText(pt.x, pt.y, `+$${wage + tip}`, 'var(--lime)');
        if (perfect) setTimeout(() => floatText(pt.x, pt.y - 36, 'PERFECT', 'var(--amber)'), 120);
        if (S.streak >= 3 && S.streak % 3 === 0) { A('sparkle'); setTimeout(() => floatText(pt.x, pt.y - 72, `${S.streak} IN A ROW`, 'var(--pink2)'), 240); }
        restart(R.streak, 'pop'); restart(q('.jb-earn'), 'pop');
        leave(c, 'happy', perfect ? 'Perfect!' : pick(['Thanks!', 'Lovely', 'Cheers!']));
      } else {
        S.streak = 0; S.wrong++; A('error');
        floatText(pt.x, pt.y, 'Wrong order', '#ff8f99');
        leave(c, 'mad', pick(["That's not mine", 'Wrong drink...', 'I ordered a ' + c.order.name]));
      }
      hud();
    };

    // ---- loop
    let raf = 0, last = performance.now(), resolveEnd;
    const start = () => {
      if (S.phase !== 'intro') return;
      S.phase = 'play'; last = performance.now();
      const intro = q('.jb-intro'); intro.classList.add('out'); setTimeout(() => intro.remove(), 250);
      A('whoosh');
    };
    const close = () => {
      if (S.phase === 'closing' || S.phase === 'done') return;
      S.phase = 'closing'; q('.jb-intro')?.remove();
      A('ding'); card.classList.add('closed');
      card.insertAdjacentHTML('beforeend', `<div class="jb-banner"><b>${ic('clock')}Closing time</b></div>`);
      [...S.line].forEach((c, i) => setTimeout(() => leave(c, 'bye', i ? '' : 'See you!'), i * 120));
      setTimeout(summary, 1400);
    };
    const step = (dt) => {
      S.t += dt;
      const left = Math.max(0, DUR - S.t);
      if (S.t >= S.next && S.line.length < MAXQ && left > 3) { spawn(); S.next = S.t + (5.6 - 2.6 * diff) * (0.75 + Math.random() * 0.5); }
      for (const c of [...S.line]) {
        c.p -= (dt / c.dur) * (c === front() ? 1 : 0.45);
        c.bar.style.setProperty('--p', Math.max(0, c.p).toFixed(3));
        c.bar.className = 'jb-pat' + (c.p < 0.25 ? ' low' : c.p < 0.55 ? ' mid' : '');
        setMood(c, c.p < 0.25 ? 'mad' : c.p < 0.55 ? 'ok' : 'happy');
        if (c.p <= 0) { S.missed++; S.streak = 0; A('miss'); leave(c, 'mad', 'Too slow...'); hud(); }
      }
      R.ring.style.strokeDashoffset = ((S.t / DUR) * 100).toFixed(2);
      const sec = Math.ceil(left);
      if (sec !== S.tick) { S.tick = sec; R.time.textContent = sec; R.timeW.classList.toggle('low', sec <= 10); if (sec <= 5 && sec > 0) A('tab'); }
      if (window.__autoplay && (S.bot -= dt) <= 0) {
        S.bot = 0.28; const c = front();
        if (c) { if (S.bad) clear(); else if (S.cup.length < c.order.r.length) add(c.order.r[S.cup.length]); else serve(); }
      }
      if (left <= 0) close();
    };
    const frame = (now) => {
      const dt = Math.min(0.6, (now - last) / 1000); last = now;
      if (S.phase === 'play') step(dt);
      raf = requestAnimationFrame(frame);
    };
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const enter = e.key === 'Enter' || e.key === ' ';
      if (enter || e.key === 'Backspace') e.preventDefault();
      if (S.phase === 'intro') { if (enter) start(); return; }
      if (S.phase === 'done') { if (e.key === 'Enter') collect(); return; }
      const i = '123456'.indexOf(e.key);
      if (i >= 0 && e.key) add(KEYS[i]); else if (enter) serve(); else if (e.key === 'Backspace' || e.key === 'Delete') clear();
    };
    const result = () => ({ orders: S.orders, perfect: S.perfect, tips: S.tips, pay: S.pay });
    const collect = () => {
      if (S.phase !== 'done' || S.collected) return;
      S.collected = true; removeEventListener('keydown', onKey);
      closeOverlay(el); resolveEnd(result());
    };
    function summary() {
      cancelAnimationFrame(raf); S.phase = 'done';
      q('.jb-banner')?.remove();
      const score = S.orders + S.perfect * 0.5 - (S.missed + S.wrong) * 0.5;
      const stars = score >= 10 ? 3 : score >= 6 ? 2 : score >= 2 ? 1 : 0;
      const end = h(`<div class="jb-end"><div class="jb-sum">
        <div class="js-top"><div class="jb-badge big">${ic('coffee')}</div><div class="grow"><small>Part-time job · Café</small><h2 class="display">Shift complete</h2>
          <div class="js-rate">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.12}s">${ic('star')}</span>`).join('')}<em>${['Rough shift', 'Decent shift', 'Great shift', 'Employee of the month'][stars]}</em></div></div></div>
        <div class="js-grid">
          <div><span>${ic('check')}Orders</span><b>${S.orders}</b></div><div><span>${ic('star')}Perfect</span><b>${S.perfect}</b></div>
          <div><span>${ic('coin')}Tips</span><b>$${S.tips}</b></div><div><span>${ic('flame')}Best streak</span><b>${S.best}</b></div>
        </div>
        <div class="js-total"><span>Total pay<small>${S.orders} × $${wage} wage + $${S.tips} tips${S.missed + S.wrong ? ` · ${S.missed + S.wrong} lost` : ''}</small></span><b>$0</b></div>
        <button class="btn primary big" data-a="collect">${ic('dollar')}Collect $${S.pay}</button>
      </div></div>`);
      card.appendChild(end);
      A('reward');
      countUp($('.js-total b', end), 0, S.pay, 900, (v) => '$' + Math.round(v));
      if (window.__autoplay) setTimeout(collect, 1600);
    }
    bind(el, { start, end: close, collect, clear, serve, add: (b) => add(b.dataset.k) });
    addEventListener('keydown', onKey);
    renderTicket(); hud();
    raf = requestAnimationFrame(frame);
    setTimeout(start, window.__autoplay ? 600 : 3000);
    return new Promise((res) => { resolveEnd = res; });
  },
};
