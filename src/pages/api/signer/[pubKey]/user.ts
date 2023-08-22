import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { UserResponse } from '../../../../lib/types/user';
import { resolveUserFromFid } from '../../../../lib/user/resolve-user';

type SignerEndpointQuery = {
  pubKey: string;
};

export default async function signerUserEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
): Promise<void> {
  const { pubKey } = req.query as SignerEndpointQuery;

  const signerRow = await prisma.signers.findFirst({
    where: {
      signer: Buffer.from(pubKey, 'hex'),
      deleted_at: null
    }
  });

  if (!signerRow) {
    console.log(`Signer not found`);
    res.status(404).json({
      message: 'Signer not found'
    });
    return;
  }

  const user = await resolveUserFromFid(signerRow.fid, {
    interestsType: 'reactions'
  });

  if (!user) {
    res.status(404).json({
      message: 'User not found'
    });
    return;
  }

  res.json({ result: user });
}
