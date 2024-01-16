import { LRU } from '../lru-cache';

export async function resolveChainIcon(chainId: number) {
  const cacheName = `eip155-${chainId}`;
  const cache = LRU.get(`eip155-${chainId}`);
  if (cache) {
    return cache;
  }

  const icon = await _resolveChainIcon(chainId);
  LRU.set(cacheName, icon);
  return icon;
}

export async function _resolveChainIcon(chainId: number) {
  const chain = await fetch(
    `https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-${chainId}.json`
  );
  if (!chain.ok) {
    return null;
  }
  const chainJson = await chain.json();

  const iconRes = await fetch(
    `https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/icons/${chainJson.icon}.json`
  );
  if (!iconRes.ok) {
    return null;
  }
  const icons = await iconRes.json();
  let { url } = icons[0];

  if (url) {
    if (url.startsWith('ipfs://')) {
      url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
  }

  return url || null;
}
