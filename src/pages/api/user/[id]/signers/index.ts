import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { SignersResponse } from '../../../../../lib/types/signer';
import { serialize } from '../../../../../lib/utils';

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
          COUNT(DISTINCT m.hash) AS message_count,
          MAX(m.timestamp) AS last_message_timestamp,
          MAX(s.created_at) AS signer_created_at,
          MAX(s.timestamp) AS signer_timestamp,
          MAX(s.name) as signer_name,
          s.signer as pubkey,
          COUNT(DISTINCT CASE WHEN m.message_type = 0 THEN m.hash ELSE NULL END) AS none_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 1 THEN m.hash ELSE NULL END) AS cast_add_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 2 THEN m.hash ELSE NULL END) AS cast_remove_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 3 THEN m.hash ELSE NULL END) AS reaction_add_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 4 THEN m.hash ELSE NULL END) AS reaction_remove_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 5 THEN m.hash ELSE NULL END) AS link_add_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 6 THEN m.hash ELSE NULL END) AS link_remove_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 7 THEN m.hash ELSE NULL END) AS verification_add_eth_address_count,
          COUNT(DISTINCT CASE WHEN m.message_type = 8 THEN m.hash ELSE NULL END) AS verification_remove_count
        FROM 
          messages m
        LEFT JOIN 
          signers s ON m.signer = s.signer
        WHERE 
          m.fid = ${fid}
        GROUP BY 
          m.signer, s.signer
        ORDER BY last_message_timestamp DESC;
      `;

      const signers = signersRaw
        .filter((s: any) => s.pubkey)
        .map((signer: any) => ({
          pubKey: signer.pubkey,
          messageCount: signer.message_count,
          // TODO: Fix this
          createdAtTimestamp:
            signer.signer_timestamp || signer.signer_created_at,
          lastMessageTimestamp: signer.last_message_timestamp,
          name: signer.signer_name,
          noneCount: signer.none_count,
          castAddCount: signer.cast_add_count,
          castRemoveCount: signer.cast_remove_count,
          reactionAddCount: signer.reaction_add_count,
          reactionRemoveCount: signer.reaction_remove_count,
          linkAddCount: signer.link_add_count,
          linkRemoveCount: signer.link_remove_count,
          verificationAddEthAddressCount:
            signer.verification_add_eth_address_count,
          verificationRemoveCount: signer.verification_remove_count
        }));

      return res.json({ result: serialize(signers) });
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
