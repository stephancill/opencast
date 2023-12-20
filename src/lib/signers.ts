import { prisma } from './prisma';
import { SignerDetail } from './types/signer';

export async function getSignerDetail(
  pubKey: string
): Promise<SignerDetail | null> {
  const pubKeyBytes = Buffer.from(pubKey, 'hex');

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
            m.signer = ${pubKeyBytes}
        GROUP BY 
            m.signer, s.name
        ORDER BY 
            message_count DESC;
      `;

  const [signer] = signersRaw.map((signer: any) => ({
    pubKey: signer.pubkey,
    messageCount: signer.message_count,
    createdAtTimestamp: signer.signer_created_timestamp,
    lastMessageTimestamp: signer.last_message_timestamp,
    name: signer.signer_name
  }));

  if (!signer) return null;

  return signer;
}
