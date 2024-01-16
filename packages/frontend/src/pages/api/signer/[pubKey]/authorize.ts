import type { NextApiRequest, NextApiResponse } from 'next';
import { privateKeyToAccount } from 'viem/accounts';
import { AppAuthResponse } from '../../../../lib/types/app-auth';
import { Hex } from 'viem';

// https://warpcast.notion.site/Signer-Request-API-Migration-Guide-Public-9e74827f9070442fb6f2a7ffe7226b3c

type SignerEndpointQuery = {
  pubKey: string;
};

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: 10,
  verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553'
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' }
] as const;

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<AppAuthResponse>
): Promise<void> {
  const { pubKey } = req.query as SignerEndpointQuery;

  const appFid = process.env.APP_FID!;
  const account = privateKeyToAccount(process.env.APP_SIGNER_PK as Hex);

  const deadline = Math.floor(Date.now() / 1000) + 86400; // signature is valid for 1 day
  const signature = await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE
    },
    primaryType: 'SignedKeyRequest',
    message: {
      requestFid: BigInt(appFid),
      key: `0x${pubKey}`,
      deadline: BigInt(deadline)
    }
  });

  res.json({
    result: {
      signature,
      requestFid: parseInt(appFid),
      deadline,
      requestSigner: account.address
    }
  });
}
