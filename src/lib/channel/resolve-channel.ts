import { parseChainURL, ParsedChainURL } from '../utils';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import {} from 'viem';

export type ChannelType = {
  name: string;
  description: string;
  image: string;
  properties: {
    number: number;
    name: string;
  };
};

function isValidChannel(json: any): json is ChannelType {
  return (
    typeof json === 'object' &&
    json !== null &&
    typeof json.name === 'string' &&
    typeof json.description === 'string' &&
    typeof json.image === 'string' &&
    typeof json.properties === 'object' &&
    json.properties !== null &&
    typeof json.properties.number === 'number' &&
    typeof json.properties.name === 'string'
  );
}

// CAIP-19 URL
export async function resolveChannel(url: string) {
  const parsed = parseChainURL(url);
  if (!parsed) {
    return null;
  }

  if (parsed.chainId !== '1' && parsed.contractType !== 'erc721') {
    return null;
  }

  const client = createPublicClient({
    chain: mainnet,
    transport: http()
  });

  const data = await client.readContract({
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

  if (data.startsWith('data:application/json;base64,')) {
    const jsonString = Buffer.from(data.split(',')[1], 'base64').toString();
    const json = JSON.parse(jsonString);
    if (!isValidChannel(json)) {
      return null;
    }
    return json as ChannelType;
  }

  return null;
}
