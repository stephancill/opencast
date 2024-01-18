import { LRUCache } from 'lru-cache';
import { isProduction } from './env';

const globalForLRU = global as unknown as {
  LRU: LRUCache<string, any> | undefined;
};

export const LRU = globalForLRU.LRU ?? new LRUCache({ max: 1000 });

if (isProduction) globalForLRU.LRU = LRU;
