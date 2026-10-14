// Tiny event bus used to decouple systems (quests, chat, UI, audio).
const handlers = new Map();
export const bus = {
  on(evt, fn) {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt).add(fn);
    return () => handlers.get(evt).delete(fn);
  },
  once(evt, fn) {
    const off = bus.on(evt, (...a) => { off(); fn(...a); });
    return off;
  },
  emit(evt, data) {
    const set = handlers.get(evt);
    if (set) for (const fn of [...set]) { try { fn(data); } catch (e) { console.error('[bus]', evt, e); } }
    const any = handlers.get('*');
    if (any) for (const fn of [...any]) { try { fn(evt, data); } catch (e) { console.error(e); } }
  },
  wait(evt, filter) {
    return new Promise((res) => {
      const off = bus.on(evt, (d) => { if (!filter || filter(d)) { off(); res(d); } });
    });
  },
};
