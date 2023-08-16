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

      // const castGroups = await prisma.casts.groupBy({
      //   by: ['parent_url'],
      //   _count: {
      //     hash: true
      //   },
      //   where: {
      //     fid: fid,
      //     deleted_at: null,
      //     parent_url: {
      //       not: null
      //     }
      //   },
      //   take: 5,
      //   orderBy: {
      //     _count: {
      //       hash: 'desc'
      //     }
      //   }
      // });

      const reactionGroups = (await prisma.$queryRaw`
        SELECT 
            c.parent_url, 
            COUNT(*) as reaction_count 
        FROM 
            reactions r
        INNER JOIN 
            casts c ON r.target_hash = c.hash 
        WHERE 
            r.fid = ${fid}  
            AND c.deleted_at IS NULL 
            AND c.parent_url IS NOT NULL 
        GROUP BY c.parent_url
        ORDER BY reaction_count DESC
        LIMIT 5;
      `) as { parent_url: string; reaction_count: number }[];

      console.log(reactionGroups);

      const topics = await Promise.all(
        reactionGroups.map(async (group) => {
          const url = group.parent_url!;
          const topic = await resolveTopic(url);
          if (!topic) {
            console.log(group.parent_url);
          }
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
