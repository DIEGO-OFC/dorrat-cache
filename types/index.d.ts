import { EventEmitter } from 'node:events';

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

export type Strategy<V = any> =
  | 'lru'
  | 'lfu'
  | ((store: Map<string, { v: V; exp: number; hits: number }>, max: number) => string | undefined);

export interface CacheOptions<V = any> {
  max?: number;
  ttl?: number;
  strategy?: Strategy<V>;
  adaptive?: boolean;
  persistence?: boolean | string;
  serializer?: (snapshot: [string, { v: V; exp: number; hits: number }][] ) => string;
  deserializer?: (raw: string) => [string, { v: V; exp: number; hits: number }][];
  debounce?: number;
  evictionRate?: number;
}

export declare class DorratCache<V = any> extends EventEmitter {
  static create<V = any>(opts?: CacheOptions<V>): Promise<DorratCache<V>>;
  constructor(opts?: CacheOptions<V>);
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
  snapshot(): [string, { v: V; exp: number; hits: number }][];
  with(key: string, factory: () => Promise<V> | V, ttl?: number): Promise<V>;
  stop(): void;
  readonly stats: CacheStats;
  [Symbol.iterator](): IterableIterator<[string, V]>;
}
