import { NextApiRequest, NextApiResponse } from 'next';
import { resolveChannel } from '../../../lib/channel/resolve-channel';
import { prisma } from '../../../lib/prisma';
import { TrendsResponse } from '../../../lib/types/trends';

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

      // Get casts in the last 4 hours and group by parent_url
      const cutoffTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      const results = await prisma.casts.groupBy({
        by: ['parent_url'],
        where: {
          timestamp: {
            gte: cutoffTime
          },
          parent_url: {
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

      const channels = await Promise.all(
        results.map(async (result) => {
          const url = result.parent_url!;
          const channel = await resolveChannel(url);
          if (!channel) {
            console.log(result.parent_url);
          }
          return { channel, volume: result._count.hash, url };
        })
      );

      res.json({ result: channels });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
