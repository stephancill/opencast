import { NextApiRequest, NextApiResponse } from 'next';
import { resolveTopic } from '@lib/topics/resolve-topic';
import { prisma } from '@lib/prisma';
import { TrendsResponse } from '@lib/types/trends';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<TrendsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;

      // Get casts in the last 4 hours and group by parentUrl
      const cutoffTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      const results = await prisma.cast.groupBy({
        by: ['parentUrl'],
        where: {
          timestamp: {
            gte: cutoffTime
          },
          parentUrl: {
            not: null
          }
        },
        _count: {
          hash: true
        },
        orderBy: {
          _count: {
            hash: 'desc'
          }
        },
        take: limit
      });

      const topics = await Promise.all(
        results.map(async (result) => {
          const url = result.parentUrl!;
          const topic = await resolveTopic(url);
          return { topic, volume: result._count.hash };
        })
      );

      res.json({ result: topics });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
