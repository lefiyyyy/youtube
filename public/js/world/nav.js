// Grid-based A* navigation over the room floor.
export class NavGrid {
  constructor(minX, minZ, maxX, maxZ, cell = 0.15) {
    this.minX = minX; this.minZ = minZ; this.cell = cell;
    this.w = Math.ceil((maxX - minX) / cell); this.h = Math.ceil((maxZ - minZ) / cell);
    this.block = new Uint8Array(this.w * this.h);
  }
  idx(i, j) { return j * this.w + i; }
  toCell(x, z) { return [Math.floor((x - this.minX) / this.cell), Math.floor((z - this.minZ) / this.cell)]; }
  toWorld(i, j) { return [this.minX + (i + 0.5) * this.cell, this.minZ + (j + 0.5) * this.cell]; }
  inside(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h; }
  blocked(i, j) { return !this.inside(i, j) || this.block[this.idx(i, j)] === 1; }
  // Block an oriented rectangle (center, half-size, rotation) inflated by pad.
  addRect(cx, cz, hx, hz, ry = 0, pad = 0.2) {
    const c = Math.cos(ry), s = Math.sin(ry);
    hx += pad; hz += pad;
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const [x, z] = this.toWorld(i, j);
      const dx = x - cx, dz = z - cz;
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) <= hx && Math.abs(lz) <= hz) this.block[this.idx(i, j)] = 1;
    }
  }
  clearCircle(x, z, r) {
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const [wx, wz] = this.toWorld(i, j);
      if ((wx - x) ** 2 + (wz - z) ** 2 <= r * r) this.block[this.idx(i, j)] = 0;
    }
  }
  nearestFree(i, j) {
    if (!this.blocked(i, j)) return [i, j];
    for (let r = 1; r < 25; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.abs(di) !== r && Math.abs(dj) !== r) continue;
      if (!this.blocked(i + di, j + dj)) return [i + di, j + dj];
    }
    return [i, j];
  }
  lineFree(x0, z0, x1, z1) {
    const d = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.ceil(d / (this.cell * 0.5));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const [i, j] = this.toCell(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
      if (this.blocked(i, j)) return false;
    }
    return true;
  }
  find(x0, z0, x1, z1) {
    let [si, sj] = this.nearestFree(...this.toCell(x0, z0));
    let [ei, ej] = this.nearestFree(...this.toCell(x1, z1));
    const W = this.w, N = W * this.h;
    const g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = [];
    const s = this.idx(si, sj), e = this.idx(ei, ej);
    g[s] = 0; open.push([Math.hypot(ei - si, ej - sj), s]);
    const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let found = false, iter = 0;
    while (open.length && iter++ < 20000) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
      const [, cur] = open.splice(bi, 1)[0];
      if (cur === e) { found = true; break; }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % W, cj = (cur / W) | 0;
      for (const [di, dj, cost] of dirs) {
        const ni = ci + di, nj = cj + dj;
        if (this.blocked(ni, nj)) continue;
        if (di && dj && (this.blocked(ci + di, cj) || this.blocked(ci, cj + dj))) continue;
        const n = this.idx(ni, nj);
        const ng = g[cur] + cost;
        if (ng < g[n]) { g[n] = ng; came[n] = cur; open.push([ng + Math.hypot(ei - ni, ej - nj), n]); }
      }
    }
    const pts = [];
    if (found) { let c = e; while (c !== -1) { pts.push(this.toWorld(c % W, (c / W) | 0)); c = came[c]; } pts.reverse(); }
    else pts.push([x1, z1]);
    pts[pts.length - 1] = [x1, z1];
    pts.unshift([x0, z0]);
    // string pulling
    const out = [pts[0]];
    let a = 0;
    while (a < pts.length - 1) {
      let b = pts.length - 1;
      while (b > a + 1 && !this.lineFree(pts[a][0], pts[a][1], pts[b][0], pts[b][1])) b--;
      out.push(pts[b]); a = b;
    }
    return out;
  }
}
