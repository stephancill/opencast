import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { SignersResponse } from '../../../../lib/types/signer';
import { serialize } from '../../../../lib/utils';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<SignersResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);

      if (!fid) {
        res.status(400).json({ message: 'Missing id' });
        return;
      }

      const signersRaw = await prisma.$queryRaw<any>`
        SELECT 
            m.signer AS pubkey,
            COUNT(m.id) AS message_count,
            MAX(m.timestamp) AS last_message_timestamp,
            MAX(s.timestamp) AS signer_created_timestamp,
            s.name AS signer_name
        FROM 
            messages m
        LEFT JOIN 
            signers s ON m.signer = s.signer
        WHERE 
            m.fid = 1689
        GROUP BY 
            m.signer, s.name
        ORDER BY 
        message_count DESC;
      `;

      const signers = signersRaw.map((signer: any) => ({
        pubKey: signer.pubkey,
        messageCount: signer.message_count,
        createdAtTimestamp: signer.signer_created_timestamp,
        lastMessageTimestamp: signer.last_message_timestamp,
        name: signer.signer_name
      }));

      return res.json({ result: serialize(signers) });
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
