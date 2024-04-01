import { NextApiRequest, NextApiResponse } from 'next';
import {
  getTweetsPaginatedPrismaArgs,
  PaginatedTweetsResponse
} from '../../../../lib/paginated-tweets';
import { getEmbedsForTweetIds } from '../../../../lib/embeds';
import { mergeMetadataCacheResponse } from '../../../../lib/types/tweet';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const id = req.query.id;
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;

      const result = await getTweetsPaginatedPrismaArgs({
        where: {
          timestamp: {
            lt: cursor || undefined
          },
          parent_hash: Buffer.from(id as string, 'hex'),
          deleted_at: null
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      res.json({
        result
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
