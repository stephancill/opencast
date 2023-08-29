import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import { resolveChainIcon } from '../chains/resolve-chain-icon';
import { populateEmbed } from '../embeds';
import { LRU } from '../lru-cache';
import { TopicType } from '../types/topic';
import { ExternalEmbed } from '../types/tweet';
import { parseChainURL, truncateAddress } from '../utils';

const chainById = Object.values(chains).reduce(
  (acc: { [key: string]: chains.Chain }, cur) => {
    if (cur.id) acc[cur.id] = cur;
    return acc;
  },
  {}
);

export type TopicsMapType = { [key: string]: TopicType };

export async function resolveTopic(url: string): Promise<TopicType | null> {
  const key = `topic:${url}`;
  const cached = LRU.get(key);
  if (cached !== undefined) {
    return cached as TopicType;
  }

  const resolved = await _resolveTopic(url);
  // If we can't resolve the topic, cache it for 5 minutes
  LRU.set(key, resolved, {
    ttl: resolved === null ? 5 * 60 * 1000 : undefined
  });

  return resolved;
}

function cleanUrl(url: string): string {
  if (url.startsWith('https://')) {
    return cleanUrl(url.slice(8));
  } else if (url.startsWith('www.')) {
    return url.slice(4);
  } else {
    // TODO: Remove tracking params (utm*) and trailing slash
    return url;
  }
}

// CAIP-19 URL
async function _resolveTopic(url: string): Promise<TopicType | null> {
  if (url.startsWith('https://')) {
    let metadata: ExternalEmbed | null;
    try {
      metadata = await populateEmbed({ url: url });
    } catch {
      return {
        name: cleanUrl(url),
        description: 'Link',
        url
      };
    }

    const { text, title, icon } = metadata || {};
    const cleanedUrl = cleanUrl(url);
    let name = title || cleanedUrl;
    if (name.length > 30) {
      name = cleanedUrl;
    }
    return {
      name,
      description: text || 'Link',
      image: icon,
      url
    };
  } else if (url.startsWith('chain://')) {
    const parsed = parseChainURL(url);

    if (!parsed || parsed.contractType !== 'erc721') {
      return null;
    }

    let chainId: number;
    try {
      chainId = parseInt(parsed?.chainId);
    } catch {
      return null;
    }

    const client = createPublicClient({
      chain: chainById[chainId],
      transport: http()
    });

    let uri: string;
    try {
      uri = (await client.readContract({
        address: parsed.contractAddress as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: 'contractURI',
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'contractURI'
      })) as string;
    } catch (e) {
      try {
        uri = (await client.readContract({
          address: parsed.contractAddress as `0x${string}`,
          abi: [
            {
              inputs: [{ name: 'tokenId', type: 'uint256' }],
              name: 'tokenURI',
              outputs: [{ name: '', type: 'string' }],
              stateMutability: 'view',
              type: 'function'
            }
          ],
          functionName: 'tokenURI',
          args: [BigInt(1)]
        })) as string;
      } catch {
        const truncatedAddress = truncateAddress(parsed.contractAddress);

        const chainIcon = await resolveChainIcon(chainId);

        return {
          name: `${truncatedAddress}`,
          description: `NFT on ${chainById[chainId].name} at ${parsed.contractAddress}`,
          image: chainIcon,
          url
        };
      }

      if (!uri) return null;
    }

    if (uri.startsWith('data:application/json;base64,')) {
      const jsonString = Buffer.from(uri.split(',')[1], 'base64').toString();

      let json: any;
      try {
        json = JSON.parse(jsonString);
      } catch (e) {
        return null;
      }

      let image = json.image as string;
      if (image) {
        if (image.startsWith('ipfs://')) {
          image = `https://ipfs.io/ipfs/${image.slice(7)}`;
        }
      }

      return {
        name: json.name,
        description: json.description,
        image: image,
        url
      };
    } else if (uri.startsWith('ipfs://') || uri.startsWith('https://')) {
      try {
        let metadata: any;
        if (uri.startsWith('ipfs://')) {
          // Resolve IPFS URI
          const url = `https://ipfs.io/ipfs/${uri.slice(7)}`;
          const res = await fetch(url);
          metadata = await res.json();
        } else if (uri.startsWith('https://')) {
          // Resolve HTTPS URI
          const res = await fetch(uri);
          metadata = await res.json();
        }

        let image = metadata.image as string;
        if (image) {
          if (image.startsWith('ipfs://')) {
            image = `https://ipfs.io/ipfs/${image.slice(7)}`;
          }
        }

        return {
          name: metadata.name,
          description: metadata.description,
          image: image,
          url
        };
      } catch (e) {
        console.error(e);
      }
    }

    return null;
  } else {
    return {
      name: url,
      description: 'Other',
      url
    };
  }
}

export async function resolveTopicsMap(urls: string[]): Promise<TopicsMapType> {
  const topicOrNulls = await Promise.all(urls.map((url) => resolveTopic(url)));
  const topics = topicOrNulls.filter(
    (topicOrNull) => topicOrNull !== null
  ) as TopicType[];
  const topicsMap = topics.reduce((acc: TopicsMapType, cur) => {
    if (cur) {
      acc[cur.url] = cur;
    }
    return acc;
  }, {});
  return topicsMap;
}
