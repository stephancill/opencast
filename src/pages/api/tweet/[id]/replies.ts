import { NextApiRequest, NextApiResponse } from 'next';
import {
  getTweetsPaginated,
  PaginatedTweetsResponse
} from '../../../../lib/paginated-tweets';

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

      const { tweets, users, nextPageCursor } = await getTweetsPaginated({
        where: {
          AND: [
            {
              timestamp: {
                lt: cursor || undefined
              }
            },
            {
              parent_hash: Buffer.from(id as string, 'hex')
            },
            {
              deleted_at: null
            }
          ]
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      res.json({
        result: { tweets, users, nextPageCursor }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
