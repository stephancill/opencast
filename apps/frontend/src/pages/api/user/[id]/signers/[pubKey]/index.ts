import type { NextApiRequest, NextApiResponse } from 'next';
import { getSignerDetail } from '../../../../../../lib/signers';
import { serialize } from '../../../../../../lib/utils';

type SignerEndpointQuery = {
  pubKey: string;
  id: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { pubKey } = req.query as SignerEndpointQuery;

  const signer = await getSignerDetail(pubKey);

  if (!signer) {
    console.log(`Signer not found`);
    res.status(404).json({
      message: 'Signer not found'
    });
    return;
  }

  return res.json({ result: serialize(signer) });
}
