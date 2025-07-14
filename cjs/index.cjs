const { EventEmitter } = require('events');
const { writeFile, readFile } = require('fs').promises;
const { resolve, dirname } = require('path');
const { fileURLToPath } = require('url');

class DorratCache extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.max = opts.max ?? 256;
    this.baseTTL = opts.ttl ?? 60000;
    this.strategy = opts.strategy ?? 'lru';
    this.adaptive = opts.adaptive ?? true;
    this.persist = opts.persistence ?? false;
    this.store = new Map();
    if (this.persist) {
      const p = typeof this.persist === 'string' ? this.persist : resolve(dirname(fileURLToPath(__filename)), 'dorrat-cache.json');
      this._file = p;
      this._restore();
    }
  }

  set(key, value, ttl = this.baseTTL) {
    const now = Date.now();
    const exp = now + ttl;
    const meta = { v: value, exp, hits: 0 };
    if (this.strategy === 'lru') this.store.delete(key);
    this.store.set(key, meta);
    this._evict();
    this._schedule();
    this.emit('set', key, value);
    return this;
  }

  get(key, def) {
    const obj = this.store.get(key);
    if (!obj) return def;
    const now = Date.now();
    if (obj.exp <= now) {
      this.delete(key);
      return def;
    }
    obj.hits++;
    if (this.adaptive && obj.exp - now < this.baseTTL / 2) obj.exp = now + Math.min(this.baseTTL * 8, this.baseTTL + obj.hits * 1000);
    if (this.strategy === 'lru') {
      this.store.delete(key);
      this.store.set(key, obj);
    }
    if (this.strategy === 'lfu') {
      obj.rank = obj.hits;
    }
    this.emit('hit', key, obj.v);
    return obj.v;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  ttl(key) {
    const obj = this.store.get(key);
    return obj ? Math.max(0, obj.exp - Date.now()) : -1;
  }

  delete(key) {
    const existed = this.store.delete(key);
    if (existed) this.emit('del', key);
    this._schedule();
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
    return JSON.parse(JSON.stringify([...this.store.entries()]));
  }

  _evict() {
    if (this.store.size <= this.max) return;
    if (this.strategy === 'lru') {
      const oldest = this.store.keys().next().value;
      this.delete(oldest);
      this.emit('evict', oldest);
    } else if (this.strategy === 'lfu') {
      let minHits = Infinity;
      let candidate;
      for (const [k, o] of this.store) {
        if (o.hits < minHits) {
          minHits = o.hits;
          candidate = k;
        }
      }
      if (candidate !== undefined) {
        this.delete(candidate);
        this.emit('evict', candidate);
      }
    }
  }

  _schedule() {
    if (!this.persist) return;
    clearTimeout(this._tid);
    this._tid = setTimeout(() => this._dump(), 400).unref();
  }

  async _dump() {
    if (!this.persist) return;
    const serial = JSON.stringify([...this.store.entries()]);
    await writeFile(this._file, serial, 'utf8');
  }

  async _restore() {
    try {
      const raw = await readFile(this._file, 'utf8');
      const arr = JSON.parse(raw);
      const now = Date.now();
      arr.forEach(([k, o]) => {
        if (o.exp > now) this.store.set(k, o);
      });
    } catch {}
  }

  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}

module.exports = { DorratCache };
