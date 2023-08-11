import { NextApiRequest, NextApiResponse } from 'next';
import {
  getTweetsPaginated,
  PaginatedTweetsResponse
} from '../../../lib/paginated-tweets';
import { parseChainURL } from '../../../lib/utils';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const channel = (req.query.channel as string[])
        .join('/')
        .replace('chain:/', 'chain://');
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;

      console.log('channel', parseChainURL(channel));

      const { tweets, users, nextPageCursor } = await getTweetsPaginated({
        where: {
          AND: [
            {
              timestamp: {
                lt: cursor || undefined
              }
            },
            {
              parent_hash: null
            },
            {
              deleted_at: null
            },
            {
              parent_url: channel
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
