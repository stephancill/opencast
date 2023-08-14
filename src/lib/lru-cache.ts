import { LRUCache } from 'lru-cache';

const globalForLRU = global as unknown as {
  LRU: LRUCache<string, any> | undefined;
};

export const LRU = globalForLRU.LRU ?? new LRUCache({ max: 100 });

if (process.env.NODE_ENV !== 'production') globalForLRU.LRU = LRU;
