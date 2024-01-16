import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import { serialize } from '../../../../../../lib/utils';
import { MessagesArchiveResponse } from '../../../../../../lib/types/signer';
import { Message } from '@farcaster/hub-nodejs';
import { getSignerDetail } from '../../../../../../lib/signers';

type SignerEndpointQuery = {
  pubKey: string;
  id: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MessagesArchiveResponse>
): Promise<void> {
  const { pubKey } = req.query as SignerEndpointQuery;

  const signer = await getSignerDetail(pubKey);

  if (!signer)
    return res.status(404).json({
      message: 'Signer not found'
    });

  const pubKeyBytes = Buffer.from(pubKey, 'hex');
  const messageRows = await prisma.messages.findMany({
    where: {
      signer: pubKeyBytes
    },
    distinct: ['hash']
  });

  const messages = messageRows.map((m) =>
    Message.toJSON(Message.decode(m.raw))
  );

  return res.json({
    result: {
      messages: serialize(messages) as Message[],
      signer: serialize(signer)
    }
  });
}
