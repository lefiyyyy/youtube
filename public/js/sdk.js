// Optional CrazyGames SDK v3 integration. The game runs fully without it.
export const SDK = {
  sdk: null,
  async init() {
    const host = location.hostname;
    const want = /crazygames/i.test(host) || new URLSearchParams(location.search).has('cgsdk');
    if (!want) return;
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
        setTimeout(() => rej(new Error('sdk timeout')), 4000);
      });
      await window.CrazyGames.SDK.init();
      this.sdk = window.CrazyGames.SDK;
    } catch (e) { console.info('CrazyGames SDK unavailable, continuing offline.'); }
  },
  loadingStart() { try { this.sdk?.game.loadingStart(); } catch {} },
  loadingStop() { try { this.sdk?.game.loadingStop(); } catch {} },
  gameplayStart() { try { this.sdk?.game.gameplayStart(); } catch {} },
  gameplayStop() { try { this.sdk?.game.gameplayStop(); } catch {} },
  happy() { try { this.sdk?.game.happytime(); } catch {} },
};
