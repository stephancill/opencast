import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import { parseChainURL } from '../utils';

const chainById = Object.values(chains).reduce(
  (acc: { [key: string]: chains.Chain }, cur) => {
    if (cur.id) acc[cur.id] = cur;
    return acc;
  },
  {}
);

export type ChannelType = {
  name: string;
  description: string;
  image?: string;
};

// CAIP-19 URL
// TODO: Cache result
export async function resolveChannel(url: string): Promise<ChannelType | null> {
  if (url.startsWith('https://')) {
    return {
      name: url,
      description: 'Link'
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
      uri = await client.readContract({
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
      });
    } catch (e) {
      try {
        uri = await client.readContract({
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
        });
      } catch {
        return null;
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

      return {
        name: json.name,
        description: json.description,
        image: json.image
      };
    }

    return null;
  } else {
    return {
      name: url,
      description: 'Other'
    };
  }
}
