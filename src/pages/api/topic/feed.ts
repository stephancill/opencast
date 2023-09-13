import { NextApiRequest, NextApiResponse } from 'next';
import {
  getTweetsPaginatedPrismaArgs,
  PaginatedTweetsResponse
} from '../../../lib/paginated-tweets';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const topicUrl = decodeURIComponent(req.query.url as string);
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
          parent_hash: null,
          deleted_at: null,
          parent_url: topicUrl,
          messages: {
            deleted_at: null
          }
        },
        take: limit,
        orderBy: {
          timestamp: 'desc'
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
