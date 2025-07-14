import { EventEmitter } from 'node:events';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defSer = JSON.stringify;
const defDeser = JSON.parse;

export default class DorratCache extends EventEmitter {
  static async create(opts = {}) {
    const c = new DorratCache(opts, true);
    if (c.persist) await c._restore();
    return c;
  }

  constructor(opts = {}, _internal = false) {
    super();
    this.max = opts.max ?? 256;
    this.baseTTL = opts.ttl ?? 60000;
    this.strategy = opts.strategy ?? 'lru';
    this.adaptive = opts.adaptive ?? true;
    this.persist = opts.persistence ?? false;
    this.serializer = opts.serializer ?? defSer;
    this.deserializer = opts.deserializer ?? defDeser;
    this.debounce = opts.debounce ?? 500;
    this.evictRate = opts.evictionRate ?? 1;
    this.customEvict = typeof this.strategy === 'function' ? this.strategy : null;
    this.store = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    if (this.persist) {
      const p = typeof this.persist === 'string'
        ? this.persist
        : resolve(dirname(fileURLToPath(import.meta.url)), 'dorrat-cache.json');
      this._file = p;
      if (!_internal) void this._restore();
    }
  }

  set(key, value, ttl = this.baseTTL) {
    const now = Date.now();
    const meta = { v: value, exp: now + ttl, hits: 0 };
    if (this.strategy === 'lru') this.store.delete(key);
    this.store.set(key, meta);
    this._evict();
    this._schedule();
    this.emit('set', key, value);
    return this;
  }

  get(key, def) {
    const obj = this.store.get(key);
    if (!obj) {
      this.stats.misses++;
      return def;
    }
    const now = Date.now();
    if (obj.exp <= now) {
      this.delete(key);
      this.stats.misses++;
      return def;
    }
    obj.hits++;
    this.stats.hits++;
    if (this.adaptive && obj.exp - now < this.baseTTL / 2 && obj.hits < 65536) {
      const factor = Math.min(8, Math.ceil(Math.log2(obj.hits + 1)));
      obj.exp = now + this.baseTTL * factor;
    }
    if (this.strategy === 'lru') {
      this.store.delete(key);
      this.store.set(key, obj);
    }
    this.emit('hit', key, obj.v);
    return obj.v;
  }

  has(key) {
    return this.store.has(key) && this.ttl(key) > 0;
  }

  ttl(key) {
    const o = this.store.get(key);
    return o ? Math.max(0, o.exp - Date.now()) : -1;
  }

  delete(key) {
    const existed = this.store.delete(key);
    if (existed) {
      this.emit('del', key);
      this._schedule();
    }
    return existed;
  }

  clear() {
    this.store.clear();
    this.emit('clear');
    this._schedule();
  }

  size() {
    return this.store.size;
  }

  keys() {
    return [...this.store.keys()];
  }

  values() {
    return [...this.store.values()].map(o => o.v);
  }

  entries() {
    return [...this.store.entries()].map(([k, o]) => [k, o.v]);
  }

  snapshot() {
    return [...this.store.entries()];
  }

  async with(key, factory, ttl = this.baseTTL) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const val = await factory();
    this.set(key, val, ttl);
    return val;
  }

  stop() {
    clearTimeout(this._tid);
  }

  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }

  _evict() {
    if (this.store.size <= this.max) return;
    const evictOnce = () => {
      let victim;
      switch (this.strategy) {
        case 'lru':
          victim = this.store.keys().next().value;
          break;
        case 'lfu': {
          let min = Infinity;
          for (const [k, o] of this.store) {
            if (o.hits < min) {
              min = o.hits;
              victim = k;
            }
          }
          break;
        }
        default:
          if (this.customEvict) victim = this.customEvict(this.store, this.max);
      }
      if (victim !== undefined) {
        this.stats.evictions++;
        this.delete(victim);
        this.emit('evict', victim);
      }
    };
    const over = this.store.size - this.max;
    const count = Math.max(over, this.evictRate);
    for (let i = 0; i < count && this.store.size > this.max; i++) evictOnce();
  }

  _schedule() {
    if (!this.persist) return;
    clearTimeout(this._tid);
    this._tid = setTimeout(() => this._dump(), this.debounce).unref();
  }

  async _dump() {
    if (!this.persist) return;
    try {
      const data = this.serializer(this.snapshot());
      await writeFile(this._file, data, 'utf8');
    } catch (err) {
      this.emit('error', err);
    }
  }

  async _restore() {
    try {
      const raw = await readFile(this._file, 'utf8');
      const arr = this.deserializer(raw);
      const now = Date.now();
      arr.forEach(([k, o]) => {
        if (o.exp > now) this.store.set(k, o);
      });
      this.emit('restore', this.store.size);
    } catch {}
  }
}
