// Compatibility layer for older browsers (Safari / iOS 15–16, Firefox < 112, older Android WebViews).
// Imported first by main.js, before any game code runs.

// Canvas roundRect: Safari 16+, Firefox 112+. Used for UI and effect textures.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii = 0) {
    let r = Array.isArray(radii) ? radii[0] ?? 0 : radii;
    if (r && typeof r === 'object') r = r.x ?? 0;
    r = Math.max(0, Math.min(+r || 0, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

// iOS Safari ignores user-scalable=no: block the page pinch-zoom gesture (the 3D view has its own pinch zoom).
// (Double-tap zoom is already off through touch-action: manipulation in the CSS.)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
