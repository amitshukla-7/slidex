import { Point3D, HandLandmarks, OneEuroConfig } from './types';

/**
 * 1 Euro Filter single-dimension lowpass implementation
 * Reference: Casiez, Roussel, & Vogel (CHI 2012)
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
    } else {
      this.y = alpha * value + (1 - alpha) * this.s!;
      this.s = this.y;
    }
    return this.y;
  }

  hasLast(): boolean {
    return this.y !== null;
  }

  last(): number {
    return this.y ?? 0;
  }

  reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter1D {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(config: Partial<OneEuroConfig> = {}) {
    this.minCutoff = config.minCutoff ?? 1.0; // 1.0 Hz
    this.beta = config.beta ?? 0.007;
    this.dCutoff = config.dCutoff ?? 1.0;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 1e-4); // in seconds
    this.lastTime = timestamp;

    // Estimate derivative
    const dx = this.xFilter.hasLast() ? (value - this.xFilter.last()) / dt : 0;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    // Dynamic cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }

  updateConfig(config: Partial<OneEuroConfig>): void {
    if (config.minCutoff !== undefined) this.minCutoff = config.minCutoff;
    if (config.beta !== undefined) this.beta = config.beta;
    if (config.dCutoff !== undefined) this.dCutoff = config.dCutoff;
  }
}

/**
 * Filter 21 3D hand landmarks in parallel
 */
export class HandLandmarkOneEuroFilter {
  private filters: { x: OneEuroFilter1D; y: OneEuroFilter1D; z: OneEuroFilter1D }[] = [];

  constructor(config: Partial<OneEuroConfig> = {}) {
    for (let i = 0; i < 21; i++) {
      this.filters.push({
        x: new OneEuroFilter1D(config),
        y: new OneEuroFilter1D(config),
        z: new OneEuroFilter1D(config),
      });
    }
  }

  filter(landmarks: HandLandmarks, timestamp: number): HandLandmarks {
    if (landmarks.length !== 21) return landmarks;

    return landmarks.map((pt, idx) => {
      const f = this.filters[idx];
      return {
        x: f.x.filter(pt.x, timestamp),
        y: f.y.filter(pt.y, timestamp),
        z: f.z.filter(pt.z, timestamp),
      };
    });
  }

  reset(): void {
    this.filters.forEach((f) => {
      f.x.reset();
      f.y.reset();
      f.z.reset();
    });
  }

  updateConfig(config: Partial<OneEuroConfig>): void {
    this.filters.forEach((f) => {
      f.x.updateConfig(config);
      f.y.updateConfig(config);
      f.z.updateConfig(config);
    });
  }
}
