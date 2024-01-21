import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { resolveTopic } from '../../../../lib/topics/resolve-topic';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);

      if (!fid) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }

      const reactionGroups = (await prisma.$queryRaw`
        SELECT 
            c.parentUrl, 
            COUNT(*) as reaction_count 
        FROM 
            Reaction r
        INNER JOIN 
            Cast c ON r.targetHash = c.hash 
        WHERE 
            r.fid = ${fid}  
            AND c.deletedAt IS NULL 
            AND c.parentUrl IS NOT NULL 
        GROUP BY c.parentUrl
        ORDER BY reaction_count DESC
        LIMIT 5;
      `) as { parentUrl: string; reaction_count: number }[];

      const topics = await Promise.all(
        reactionGroups.map(async (group) => {
          const url = group.parentUrl!;
          const topic = await resolveTopic(url);
          return { topic, volume: Number(group.reaction_count) };
        })
      );

      res.json({ topics });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
