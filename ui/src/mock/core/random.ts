/**
 * Seeded randomness. Generators never call Math.random: they ask for a stream keyed by
 * what they generate, `rng('sample', 'services')`, so adding an object never reshuffles the
 * others and the same key always gives the same values.
 */

/** The one world seed. Changing it changes every generated value. */
export const WORLD_SEED = 'prototype-v1';

/** 32-bit string hash (FNV-1a with a murmur finaliser). */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function keyOf(keys: readonly (string | number)[]): string {
  return `${WORLD_SEED}|${keys.join('|')}`;
}

/** A seeded pseudo-random stream (mulberry32). */
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Random.pick on an empty list');
    return items[Math.floor(this.next() * items.length)];
  }

  /** Picks by weight: `weighted([['low', 6], ['high', 1]])`. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1][0];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** `count` distinct items in random order. */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.max(0, count));
  }

  /** Normal distribution (Box-Muller). */
  normal(mean = 0, sd = 1): number {
    const u = 1 - this.next();
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** `value` moved by up to ±`fraction` of itself: `jitter(100, 0.1)` is 90..110. */
  jitter(value: number, fraction: number): number {
    return value * (1 + this.float(-fraction, fraction));
  }

  /** Lowercase hex string, for ids that look machine-made. */
  hex(length: number): string {
    let out = '';
    while (out.length < length) out += Math.floor(this.next() * 16).toString(16);
    return out;
  }
}

/** A fresh stream for one generator: `rng('sample', 'activity', serviceId)`. */
export function rng(...keys: (string | number)[]): Random {
  return new Random(hashString(keyOf(keys)));
}

/**
 * One deterministic number in [0, 1) for a key, without keeping a stream. Use it for pure
 * functions such as a metric at a given object and minute: `noise('cpu', id, minute)`.
 */
export function noise(...keys: (string | number)[]): number {
  return hashString(keyOf(keys)) / 4294967296;
}
