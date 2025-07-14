import { EventEmitter } from 'node:events';

export interface CacheOptions {
  max?: number;
  ttl?: number;
  strategy?: 'lru' | 'lfu';
  adaptive?: boolean;
  persistence?: boolean | string;
}

export declare class DorratCache<V = any> extends EventEmitter {
  constructor(opts?: CacheOptions);
  set(key: string, value: V, ttl?: number): this;
  get(key: string, def?: V): V | undefined;
  has(key: string): boolean;
  ttl(key: string): number;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
  keys(): string[];
  values(): V[];
  entries(): [string, V][];
  snapshot(): [string, V][];
  [Symbol.iterator](): IterableIterator<[string, V]>;
}
