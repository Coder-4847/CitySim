import { clamp } from '../simulation/rules.js';

export class Camera {
  constructor() { this.x = 0; this.y = -610; this.zoom = 1; this.targetX = this.x; this.targetY = this.y; this.targetZoom = 1; this.width = 1200; this.height = 800; }
  project(x, y, elevation = 0) { return { x: this.width / 2 + this.x + (x - y) * 24 * this.zoom, y: this.height / 2 + this.y + ((x + y) * 12 - elevation * 5) * this.zoom }; }
  pick(sx, sy, size) {
    const a = (sx - this.width / 2 - this.x) / (24 * this.zoom);
    const b = (sy - this.height / 2 - this.y) / (12 * this.zoom);
    const x = Math.floor((a + b) / 2 + .5), y = Math.floor((b - a) / 2 + .5);
    return x >= 0 && y >= 0 && x < size && y < size ? y * size + x : null;
  }
  pan(dx, dy) { this.targetX = clamp(this.targetX + dx, -1450 * this.targetZoom, 1450 * this.targetZoom); this.targetY = clamp(this.targetY + dy, -1480 * this.targetZoom, 260 * this.targetZoom); }
  zoomAt(factor, sx, sy) {
    const zoom = clamp(this.targetZoom * factor, .4, 2.5), ratio = zoom / this.zoom;
    this.targetX = sx - this.width / 2 - (sx - this.width / 2 - this.x) * ratio;
    this.targetY = sy - this.height / 2 - (sy - this.height / 2 - this.y) * ratio;
    this.targetZoom = zoom;
    this.pan(0, 0);
  }
  update(dt, reducedMotion) {
    const amount = reducedMotion ? 1 : 1 - Math.exp(-dt * 16);
    this.x += (this.targetX - this.x) * amount; this.y += (this.targetY - this.y) * amount;
    this.zoom += (this.targetZoom - this.zoom) * amount;
  }
  focus(x, y) { this.targetX = -(x - y) * 24 * this.targetZoom; this.targetY = -(x + y) * 12 * this.targetZoom; }
}
